"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidatePath } from "next/cache";

/**
 * Helper to ensure the current session is authenticated as a SUPER_ADMIN.
 */
async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    throw new Error("Bu işlemi gerçekleştirmek için Süper Yönetici yetkisi gerekmektedir.");
  }
}

/**
 * Gets all companies along with their feature permissions and details.
 */
export async function getCompaniesWithPermissionsAction() {
  await ensureSuperAdmin();
  try {
    return await prisma.company.findMany({
      include: {
        permissions: {
          include: {
            featureModule: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });
  } catch (error) {
    console.error("Error in getCompaniesWithPermissionsAction:", error);
    throw new Error("Şirket listesi ve izinleri alınırken bir hata oluştu.");
  }
}

/**
 * Gets all registered system features / modules.
 */
export async function getFeatureModulesAction() {
  await ensureSuperAdmin();
  try {
    return await prisma.featureModule.findMany({
      orderBy: {
        key: "asc"
      }
    });
  } catch (error) {
    console.error("Error in getFeatureModulesAction:", error);
    throw new Error("Sistem modülleri alınırken bir hata oluştu.");
  }
}

/**
 * Toggles a company permission (enabling/disabling a module for a tenant).
 */
export async function toggleCompanyPermissionAction(
  companyId: string,
  featureModuleId: string,
  isEnabled: boolean
) {
  await ensureSuperAdmin();
  try {
    const updated = await prisma.companyPermission.upsert({
      where: {
        companyId_featureModuleId: {
          companyId,
          featureModuleId
        }
      },
      update: {
        isEnabled
      },
      create: {
        companyId,
        featureModuleId,
        isEnabled
      }
    });

    revalidatePath("/[locale]/admin/super-admin", "page");
    return { success: true, updated };
  } catch (error) {
    console.error("Error in toggleCompanyPermissionAction:", error);
    throw new Error("İzin güncellenirken bir hata oluştu.");
  }
}

/**
 * Self-upgrade action for a tenant company administrator.
 * Automatically enables all system modules for their company.
 */
export async function upgradeCompanyToProAction() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Oturum açmanız gerekmektedir.");
  }

  const user = session.user as any;
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Bu işlemi gerçekleştirmek için şirket yöneticisi yetkisi gerekmektedir.");
  }

  const companyId = user.companyId;
  if (!companyId) {
    throw new Error("Herhangi bir şirkete bağlı değilsiniz.");
  }

  try {
    const features = await prisma.featureModule.findMany();
    for (const f of features) {
      await prisma.companyPermission.upsert({
        where: {
          companyId_featureModuleId: {
            companyId,
            featureModuleId: f.id
          }
        },
        update: { isEnabled: true },
        create: {
          companyId,
          featureModuleId: f.id,
          isEnabled: true
        }
      });
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error in upgradeCompanyToProAction:", error);
    throw new Error("Şirket paket yükseltme işlemi başarısız oldu.");
  }
}

