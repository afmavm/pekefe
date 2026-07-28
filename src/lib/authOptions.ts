import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Geçersiz giriş bilgileri.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Kullanıcı bulunamadı.");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Hatalı şifre.");
        }

        if (user.role === "DEALER" && user.isApproved === false) {
          throw new Error("Hesabınız henüz onaylanmamış. Lütfen yönetici onayı bekleyin.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as any,
          isApproved: user.isApproved,
          branchId: user.branchId,
          warehouseId: user.warehouseId,
          companyId: user.companyId,
          customer_type: user.customer_type,
          b2b_group_id: user.b2b_group_id
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.isApproved = user.isApproved;
        (user as any).branchId;
        token.branchId = (user as any).branchId;
        token.warehouseId = (user as any).warehouseId;
        token.companyId = (user as any).companyId;
        token.customer_type = (user as any).customer_type;
        token.b2b_group_id = (user as any).b2b_group_id;

        // Fetch permissions for this user
        try {
          const userRoles = await prisma.userRole.findMany({
            where: { userId: user.id },
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          });

          const permissions = new Set<string>();
          for (const ur of userRoles) {
            for (const rp of ur.role.permissions) {
              if (rp.permission?.name) {
                permissions.add(rp.permission.name);
              }
            }
          }

          // Admins automatically get all permissions
          if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            permissions.add('view_dashboard');
            permissions.add('approve_invoice');
            permissions.add('create_despatch');
            permissions.add('edit_stock');
            permissions.add('use_ai_assistant');
            permissions.add('manage_users');
          }

          token.permissions = Array.from(permissions);
        } catch (e) {
          console.error("Error fetching user permissions in JWT callback:", e);
          token.permissions = [];
        }

        // Fetch company features
        if (token.companyId) {
          try {
            const companyPerms = await prisma.companyPermission.findMany({
              where: {
                companyId: token.companyId,
                isEnabled: true
              },
              include: {
                featureModule: true
              }
            });
            token.companyFeatures = companyPerms
              .map(cp => cp.featureModule?.key)
              .filter(Boolean) as string[];
          } catch (e) {
            console.error("Error fetching company features in JWT callback:", e);
            token.companyFeatures = [];
          }
        } else {
          // If no company is assigned, default to enabling all features so single-tenant flow works
          token.companyFeatures = ['b2b', 'b2c', 'production', 'inventory', 'accounting'];
        }
      }

      if (trigger === "update") {
        if (session?.name) {
          token.name = session.name;
        }
        if (session?.companyFeatures) {
          token.companyFeatures = session.companyFeatures;
        } else if (token.companyId) {
          try {
            const companyPerms = await prisma.companyPermission.findMany({
              where: {
                companyId: token.companyId,
                isEnabled: true
              },
              include: {
                featureModule: true
              }
            });
            token.companyFeatures = companyPerms
              .map(cp => cp.featureModule?.key)
              .filter(Boolean) as string[];
          } catch (e) {
            console.error("Error re-fetching company features:", e);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.isApproved = token.isApproved;
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
    signIn: "/login-customer",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
