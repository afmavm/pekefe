"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { CreateDealerSchema, UpdateDealerSchema } from "./validation";
import { revalidatePath } from "next/cache";

export async function getDealersData() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    // 1. Fetch current accounts (dealers)
    const accounts = await prisma.currentAccount.findMany({
      where: {
        isDeleted: false,
        OR: [
          { type: "Müşteri" },
          { type: "MUSTERI" }
        ]
      },
      include: {
        subAccounts: true,
        transactions: {
          orderBy: { date: "desc" }
        },
        invoices: {
          orderBy: { date: "desc" }
        }
      },
      orderBy: { name: "asc" }
    });

    // 2. Fetch users with role DEALER to match approval states
    const dealerUsers = await prisma.user.findMany({
      where: {
        role: "DEALER",
        isDeleted: false
      }
    });

    // Match isApproved state dynamically from User model
    const accountsWithApproval = accounts.map((acc) => {
      const user = dealerUsers.find((u) => u.email === acc.email);
      return {
        ...JSON.parse(JSON.stringify(acc)),
        isApproved: user ? user.isApproved : true // Default to true for ERP-only accounts without login user
      };
    });

    // 3. Fetch pending dealer applications (User with role "DEALER" and isApproved = false)
    const pendingApplications = await prisma.user.findMany({
      where: {
        role: "DEALER",
        isApproved: false,
        isDeleted: false
      },
      orderBy: { id: "desc" }
    });

    const formattedApplications = await Promise.all(
      pendingApplications.map(async (user) => {
        const matchingAcc = accounts.find((a) => a.email === user.email);
        return {
          id: user.id,
          companyName: matchingAcc?.name || user.name || "Bilinmeyen Firma",
          contactName: user.name || "İsimsiz Yetkili",
          email: user.email || "",
          phone: matchingAcc?.phone || "Belirtilmedi",
          taxNumber: matchingAcc?.taxId || "Belirtilmedi",
          taxOffice: matchingAcc?.taxOffice || "Belirtilmedi",
          createdAt: user.id.startsWith("c") ? new Date() : new Date(), // fallback
          status: "BEKLEMEDE"
        };
      })
    );

    // 4. Fetch products for price calculator simulator
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" }
    });

    return {
      success: true,
      data: {
        dealers: accountsWithApproval,
        pendingApplications: formattedApplications,
        products: JSON.parse(JSON.stringify(products))
      }
    };
  } catch (error) {
    console.error("Error in getDealersData:", error);
    return { success: false, error: "Bayi verileri yüklenirken bir hata oluştu." };
  }
}

export async function createDealerAction(input: any) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  const validation = CreateDealerSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  try {
    const existing = await prisma.currentAccount.findFirst({
      where: { email: data.email, isDeleted: false }
    });

    if (existing) {
      return { success: false, error: "Bu e-posta adresiyle kayıtlı başka bir bayi bulunmaktadır." };
    }

    const account = await prisma.currentAccount.create({
      data: {
        name: data.name,
        type: "Müşteri",
        cariKod: data.cariKod || "CARI-" + Math.floor(100000 + Math.random() * 900000),
        cariTipi: data.cariTipi || "CORPORATE",
        ad: data.ad || null,
        soyad: data.soyad || null,
        tckn: data.tckn || null,
        dogumTarihi: data.dogumTarihi ? new Date(data.dogumTarihi) : null,
        taxId: data.taxId,
        taxNo: data.taxId, // Keep taxNo in sync
        taxOffice: data.taxOffice,
        mersisNo: data.mersisNo || null,
        yetkiliKisi: data.yetkiliKisi || null,
        webSitesi: data.webSitesi || null,
        phone: data.phone,
        email: data.email,
        balance: data.balance || 0,
        dealerGroup: data.dealerGroup,
        priceGroup: data.priceGroup,
        riskLimit: data.riskLimit,
        creditLimit: data.creditLimit,
        discountRate: data.discountRate,
        loyaltyPoints: data.loyaltyPoints,
        vadeGun: data.vadeGun,
        priceFormula: data.priceFormula || null,
        parentDealerId: data.parentDealerId || null,
        b2bMinQty: data.b2bMinQty,
        b2bPaymentTerms: data.b2bPaymentTerms,
        b2bCode: data.b2bCode,
      }
    });

    revalidatePath("/admin/dealers");
    return { success: true, data: JSON.parse(JSON.stringify(account)) };
  } catch (error) {
    console.error("Error in createDealerAction:", error);
    return { success: false, error: "Cari hesap oluşturulurken veritabanı hatası oluştu." };
  }
}

export async function updateDealerAction(input: any) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  const validation = UpdateDealerSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { id, ...data } = validation.data;

  try {
    const account = await prisma.currentAccount.update({
      where: { id },
      data: {
        name: data.name,
        cariKod: data.cariKod || undefined,
        cariTipi: data.cariTipi,
        ad: data.ad,
        soyad: data.soyad,
        tckn: data.tckn,
        dogumTarihi: data.dogumTarihi ? new Date(data.dogumTarihi) : null,
        taxId: data.taxId,
        taxNo: data.taxId, // Keep taxNo in sync
        taxOffice: data.taxOffice,
        mersisNo: data.mersisNo,
        yetkiliKisi: data.yetkiliKisi,
        webSitesi: data.webSitesi,
        phone: data.phone,
        email: data.email,
        balance: data.balance,
        dealerGroup: data.dealerGroup,
        priceGroup: data.priceGroup,
        riskLimit: data.riskLimit,
        creditLimit: data.creditLimit,
        discountRate: data.discountRate,
        loyaltyPoints: data.loyaltyPoints,
        vadeGun: data.vadeGun,
        priceFormula: data.priceFormula || null,
        parentDealerId: data.parentDealerId || null,
        b2bMinQty: data.b2bMinQty,
        b2bPaymentTerms: data.b2bPaymentTerms,
        b2bCode: data.b2bCode,
      }
    });

    // Sync isApproved status back to user login if it was changed
    if (account.email) {
      const user = await prisma.user.findUnique({ where: { email: account.email } });
      if (user && user.role === "DEALER" && !user.isApproved) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isApproved: true }
        });
      }
    }

    revalidatePath("/admin/dealers");
    return { success: true, data: JSON.parse(JSON.stringify(account)) };
  } catch (error) {
    console.error("Error in updateDealerAction:", error);
    return { success: false, error: "Cari hesap güncellenirken bir hata oluştu." };
  }
}

export async function approveDealerAction(userId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    // 1. Approve B2B user login
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    });

    // 2. Create CurrentAccount if missing
    if (user.email) {
      const existingAccount = await prisma.currentAccount.findFirst({
        where: { email: user.email, isDeleted: false }
      });

      if (!existingAccount) {
        await prisma.currentAccount.create({
          data: {
            name: user.name || "Yeni Bayi Firma",
            type: "Müşteri",
            email: user.email,
            balance: 0,
            dealerGroup: "Standart",
            priceGroup: "Liste",
            phone: null,
            isActive: true,
          }
        });
      }
    }

    revalidatePath("/admin/dealers");
    return { success: true, message: `"${user.name || user.email}" onaylandı ve bayi listesine eklendi.` };
  } catch (error) {
    console.error("Error in approveDealerAction:", error);
    return { success: false, error: "Başvuru onaylanırken hata oluştu." };
  }
}

export async function rejectDealerAction(userId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "Kullanıcı bulunamadı." };
    }

    if (user.email) {
      // Find associated current account and delete if there are no operations linked
      const account = await prisma.currentAccount.findFirst({
        where: { email: user.email, isDeleted: false },
        include: { transactions: true, invoices: true }
      });

      if (account) {
        if (account.transactions.length === 0 && account.invoices.length === 0) {
          await prisma.currentAccount.delete({ where: { id: account.id } });
        } else {
          // If transaction logs exist, mark it deleted rather than deleting hard database fields
          await prisma.currentAccount.update({
            where: { id: account.id },
            data: { isDeleted: true }
          });
        }
      }
    }

    // Delete user application login entry
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/admin/dealers");
    return { success: true, message: "Bayi başvuru talebi reddedildi." };
  } catch (error) {
    console.error("Error in rejectDealerAction:", error);
    return { success: false, error: "Başvuru reddedilirken hata oluştu." };
  }
}

export async function addSubAccountAction(dealerId: string, subData: {
  name: string;
  email: string;
  phone?: string;
  role: string;
  balance?: number;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    const existing = await prisma.subAccount.findFirst({
      where: { email: subData.email }
    });

    if (existing) {
      return { success: false, error: "Bu e-posta adresiyle kayıtlı başka bir alt hesap bulunmaktadır." };
    }

    const subAccount = await prisma.subAccount.create({
      data: {
        currentAccountId: dealerId,
        name: subData.name,
        email: subData.email,
        phone: subData.phone || null,
        role: subData.role,
        balance: subData.balance || 0,
      }
    });

    revalidatePath("/admin/dealers");
    return { success: true, data: JSON.parse(JSON.stringify(subAccount)) };
  } catch (error) {
    console.error("Error in addSubAccountAction:", error);
    return { success: false, error: "Alt hesap eklenirken veritabanı hatası oluştu." };
  }
}
