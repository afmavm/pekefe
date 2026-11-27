import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, withTimeout } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { readUsersAndRoles, upsertLocalUser } from "@/lib/jsonUserDb";
import { readLocalAccounts } from "@/lib/jsonCurrentAccountsDb";

// In-memory brute-force lockout tracker (per email: 5 failed attempts -> 15 min lock)
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const loginAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();

function checkLoginLockout(emailKey: string): void {
  const rec = loginAttemptsMap.get(emailKey);
  if (!rec) return;
  const now = Date.now();
  if (rec.lockedUntil > now) {
    const minsLeft = Math.ceil((rec.lockedUntil - now) / 60000);
    throw new Error(`Çok fazla başarısız giriş denemesi. Lütfen ${minsLeft} dakika sonra tekrar deneyin.`);
  }
  if (rec.lockedUntil > 0 && rec.lockedUntil <= now) {
    loginAttemptsMap.delete(emailKey);
  }
}

function recordFailedLogin(emailKey: string): void {
  const now = Date.now();
  const prev = loginAttemptsMap.get(emailKey) || { count: 0, lockedUntil: 0 };
  const nextCount = prev.count + 1;
  const lockedUntil = nextCount >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_LOCK_MS : 0;
  loginAttemptsMap.set(emailKey, { count: nextCount, lockedUntil });
  try {
    prisma.authLog.create({
      data: {
        ip: "credentials-login",
        userId: null,
        route: "/api/auth/callback/credentials",
        method: "POST",
        failReason: lockedUntil > 0
          ? `Brute-force kilidi tetiklendi (${emailKey}, ${nextCount} deneme)`
          : `Hatalı giriş denemesi (${emailKey}, #${nextCount})`,
      },
    }).catch(() => {});
  } catch {}
}

function clearFailedLogins(emailKey: string): void {
  loginAttemptsMap.delete(emailKey);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any) as any,

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Geçersiz giriş bilgileri.");
        }

        const inputEmail = credentials.email.trim().toLowerCase();
        const inputPassword = credentials.password;

        // Brute-force lockout check
        checkLoginLockout(inputEmail);

        // ── 1. Yerel Kullanıcı & Rol Veritabanında (users_roles_db.json) Doğrulama ──
        let localUserWithPasswordFound = false;
        try {
          const localData = readUsersAndRoles();
          const localUser = localData.users.find(u => u.email && u.email.toLowerCase() === inputEmail);
          if (localUser && localUser.passwordHash) {
            localUserWithPasswordFound = true;
            const isMatch = await bcrypt.compare(inputPassword, localUser.passwordHash);
            if (isMatch) {
              if (localUser.status === "passive") {
                throw new Error("Hesabınız yönetici tarafından pasife alınmıştır.");
              }
              upsertLocalUser({
                id: localUser.id,
                email: localUser.email,
                lastLogin: new Date().toISOString()
              });
              clearFailedLogins(inputEmail);
              return {
                id: localUser.id,
                name: localUser.name || "Kullanıcı",
                email: localUser.email,
                role: (localUser.role || "USER") as any,
                isApproved: localUser.isApproved ?? true,
                customer_type: localUser.customer_type || (localUser.role === "USER" ? "b2c" : "b2b"),
                permissions: localUser.customPermissions || [],
                warehouseId: localUser.warehouseId || null,
              } as any;
            }
          }
        } catch (localErr: any) {
          if (localErr.message?.includes("pasife")) {
            throw localErr;
          }
          console.warn("[AUTH LOCAL USER WARNING]:", localErr);
        }

        // ── 2. Uzak Veritabanında (Prisma MySQL) Doğrulama ──
        let user: any = null;
        try {
          user = await withTimeout(
            prisma.user.findUnique({
              where: { email: inputEmail },
            }),
            1800,
            null
          );
        } catch (dbErr) {
          console.warn("[AUTH WARNING] Veritabanı bağlantısı kurulamadı, yerel güvenli giriş deneniyor:", dbErr);
        }

        if (user && user.password) {
          const isPasswordCorrect = await bcrypt.compare(
            inputPassword,
            user.password
          );

          if (!isPasswordCorrect) {
            recordFailedLogin(inputEmail);
            throw new Error("Hatalı şifre.");
          }

          if (user.role === "DEALER" && user.isApproved === false) {
            throw new Error("Hesabınız henüz onaylanmamış. Lütfen yönetici onayı bekleyin.");
          }

          // Yerel veritabanı ile senkronize et
          try {
            upsertLocalUser({
              id: user.id,
              name: user.name || "Kullanıcı",
              email: user.email,
              role: user.role || "USER",
              passwordHash: user.password,
              customer_type: (user.customer_type || "b2c") as any,
              isApproved: user.isApproved ?? true,
              lastLogin: new Date().toISOString()
            });
          } catch {}

          clearFailedLogins(inputEmail);
          return {
            id: user.id,
            name: user.name || "Kullanıcı",
            email: user.email,
            image: user.image,
            role: user.role as any,
            isApproved: user.isApproved ?? true,
            branchId: user.branchId,
            warehouseId: user.warehouseId,
            companyId: user.companyId,
            customer_type: user.customer_type || "b2c",
            b2b_group_id: user.b2b_group_id,
          } as any;
        }

        // Eğer yerel veritabanında kullanıcının kayıtlı şifresi varsa ve eşleşmediyse reddet
        if (localUserWithPasswordFound) {
          recordFailedLogin(inputEmail);
          throw new Error("Hatalı şifre.");
        }

        // ── 3. Cari Hesaplarda (current_accounts_db.json) Tanımlı B2B/Müşteri Şifresi Kontrolü ──
        try {
          const accounts = readLocalAccounts();
          const matchedAccount = accounts.find(acc => {
            const accEmail = (acc.email || "").toLowerCase();
            const b2bEmail = ((acc.entegrasyonHaritalama as any)?.b2bEmail || "").toLowerCase();
            return accEmail === inputEmail || b2bEmail === inputEmail;
          });
          if (matchedAccount) {
            const ent = (matchedAccount.entegrasyonHaritalama as any) || {};
            if (ent.b2bPassword && ent.b2bPassword === inputPassword) {
              if (ent.b2bIsActive === "false" || matchedAccount.isActive === false) {
                throw new Error("Hesabınız pasif durumdadır.");
              }
              const salt = await bcrypt.genSalt(10);
              const hash = await bcrypt.hash(inputPassword, salt);
              const targetRole = matchedAccount.type === "BAYI" ? "DEALER" : "USER";
              const synced = upsertLocalUser({
                name: ent.b2bAdSoyad || matchedAccount.name || "Müşteri",
                email: inputEmail,
                phone: matchedAccount.phone || "",
                role: targetRole,
                passwordHash: hash,
                customer_type: matchedAccount.type === "BAYI" ? "b2b" : "b2c",
                isApproved: true,
                lastLogin: new Date().toISOString()
              });
              return {
                id: synced.id,
                name: synced.name,
                email: synced.email,
                role: synced.role as any,
                isApproved: true,
                customer_type: synced.customer_type || "b2c",
              } as any;
            }
          }
        } catch (accErr: any) {
          if (accErr.message?.includes("pasif")) throw accErr;
        }

        // GÜVENLİK: Hardcoded demo yönetici şifreleri kaldırılmıştır.
        // Tüm yönetici ve kullanıcı girişleri yalnızca veritabanındaki bcrypt hash'li şifrelerle yapılır.
        recordFailedLogin(inputEmail);
        throw new Error("Kullanıcı bulunamadı veya şifre hatalı.");
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.role = (user as any).role ?? "USER";
        token.isApproved = (user as any).isApproved ?? true;
        token.branchId = (user as any).branchId ?? null;
        token.warehouseId = (user as any).warehouseId ?? null;
        token.companyId = (user as any).companyId ?? null;
        token.customer_type = (user as any).customer_type ?? "b2c";
        token.b2b_group_id = (user as any).b2b_group_id ?? null;

        const initialPerms: string[] = Array.isArray((user as any).permissions) ? (user as any).permissions : [];
        const permissions = new Set<string>(initialPerms);

        if (token.role === "ADMIN" || token.role === "SUPER_ADMIN") {
          ["*", "view_dashboard", "approve_invoice", "create_despatch", "edit_stock", "use_ai_assistant", "manage_users"]
            .forEach((p) => permissions.add(p));
        }

        // Kullanıcı rol izinleri
        try {
          const userRoles = await withTimeout(
            prisma.userRole.findMany({
              where: { userId: user.id },
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            }),
            1200,
            []
          );

          for (const ur of userRoles) {
            for (const rp of (ur as any).role?.permissions || []) {
              if (rp.permission?.name) permissions.add(rp.permission.name);
            }
          }
        } catch {
          // keep initialPerms
        }

        token.permissions = Array.from(permissions);

        // Şirket özellikleri
        if (token.companyId) {
          try {
            const companyPerms = await withTimeout(
              prisma.companyPermission.findMany({
                where: { companyId: String(token.companyId), isEnabled: true },
                include: { featureModule: true },
              }),
              1200,
              []
            );
            token.companyFeatures = companyPerms
              .map((cp: any) => cp.featureModule?.key)
              .filter(Boolean) as string[];
          } catch {
            token.companyFeatures = ["b2b", "b2c", "production", "inventory", "accounting"];
          }
        } else {
          token.companyFeatures = ["b2b", "b2c", "production", "inventory", "accounting"];
        }
      }

      if (trigger === "update") {
        if (session?.name) token.name = session.name;
        if (session?.companyFeatures) token.companyFeatures = session.companyFeatures;
        else if (token.companyId) {
          try {
            const companyPerms = await prisma.companyPermission.findMany({
              where: { companyId: String(token.companyId), isEnabled: true },
              include: { featureModule: true },
            });
            token.companyFeatures = companyPerms
              .map((cp: any) => cp.featureModule?.key)
              .filter(Boolean) as string[];
          } catch {
            // sessizce geç
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string | undefined;
        session.user.role = token.role as string;
        session.user.isApproved = token.isApproved as boolean;
        (session.user as any).branchId = token.branchId;
        (session.user as any).warehouseId = token.warehouseId;
        (session.user as any).companyId = token.companyId;
        (session.user as any).permissions = token.permissions || [];
        (session.user as any).customer_type = token.customer_type;
        (session.user as any).b2b_group_id = token.b2b_group_id;
        (session.user as any).companyFeatures = token.companyFeatures || [];
      }
      return session;
    },
  },

  pages: {
    signIn: "/giris",
    signOut: "/giris",
    error: "/giris",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 saat (üst düzey oturum güvenliği)
    updateAge: 60 * 60,   // Saatlik yenileme
  },

  secret: process.env.NEXTAUTH_SECRET,
};
