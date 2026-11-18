import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, withTimeout } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { readUsersAndRoles, upsertLocalUser } from "@/lib/jsonUserDb";
import { readLocalAccounts } from "@/lib/jsonCurrentAccountsDb";

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

        // Eğer yerel veritabanında kullanıcının kayıtlı şifresi varsa ve eşleşmediyse eski demo şifresine düşme
        if (localUserWithPasswordFound) {
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

        // ── 4. İlk Kurulumda Tanımlı Yönetici Hesapları Fallback (ve Otomatik DB Kaydı) ──
        const DEMO_ACCOUNTS: Record<string, { role: string; name: string; customer_type?: string }> = {
          "admin@nexab2b.com": { role: "SUPER_ADMIN", name: "Süper Yönetici", customer_type: "b2b" },
          "manager@nexab2b.com": { role: "ADMIN", name: "PEKEFE Yöneticisi", customer_type: "b2b" },
          "info@pekefe.com": { role: "SUPER_ADMIN", name: "PEKEFE Yönetim", customer_type: "b2b" },
          "admin@pekefe.com": { role: "SUPER_ADMIN", name: "PEKEFE Yönetici", customer_type: "b2b" },
          "afmavm@gmail.com": { role: "SUPER_ADMIN", name: "Muhammed AKÇELİK", customer_type: "b2b" },
          "ahmet@zeta.com": { role: "DEALER", name: "Ahmet Bey (Bayi)", customer_type: "b2b" },
        };

        if (DEMO_ACCOUNTS[inputEmail] && (inputPassword === "password123" || inputPassword === "Pekefe.25")) {
          const account = DEMO_ACCOUNTS[inputEmail];
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(inputPassword, salt);
          const synced = upsertLocalUser({
            id: `local-${inputEmail}`,
            name: account.name,
            email: inputEmail,
            role: account.role,
            passwordHash: hash,
            customer_type: (account.customer_type || "b2b") as any,
            isApproved: true,
            lastLogin: new Date().toISOString()
          });
          return {
            id: synced.id,
            name: synced.name,
            email: inputEmail,
            role: synced.role as any,
            isApproved: true,
            customer_type: account.customer_type || "b2b",
            permissions: synced.customPermissions || [],
          } as any;
        }

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
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
