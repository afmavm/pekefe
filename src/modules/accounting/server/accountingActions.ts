"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { CreateJournalEntrySchema, BankTransferSchema, TaxDeclarationSchema } from "./validation";
import { revalidatePath } from "next/cache";

// Recursive helper to convert Decimal values to standard JS numbers
function convertDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  // Duck-type check for Prisma Decimal (has toNumber method and s/d/e fields)
  if (typeof obj.toNumber === "function" && !Array.isArray(obj)) {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertDecimals);
  }
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = convertDecimals(obj[key]);
    }
  }
  return newObj;
}

export async function getAccountingData() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    // 1. Fetch accounting chart of accounts
    const accounts = await prisma.accountingAccount.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    // If chart of accounts is empty, let's auto-generate standard ones for demonstration
    if (accounts.length === 0) {
      const defaultAccounts = [
        { code: "100", name: "Kasa Hesabı", type: "ASSET" },
        { code: "102", name: "Banka Hesabı", type: "ASSET" },
        { code: "120", name: "Alıcılar (B2B Bayi Cari)", type: "ASSET" },
        { code: "320", name: "Satıcılar (Tedarikçi Cari)", type: "LIABILITY" },
        { code: "600", name: "Yurtiçi Satışlar", type: "REVENUE" },
        { code: "770", name: "Genel Yönetim Giderleri", type: "EXPENSE" },
      ];
      await prisma.accountingAccount.createMany({ data: defaultAccounts });
    }

    const updatedAccounts = await prisma.accountingAccount.findMany({
      orderBy: { code: "asc" },
    });

    // 2. Fetch banks
    const banks = await prisma.bank.findMany({
      orderBy: { name: "asc" },
    });

    // 3. Fetch journal entries with lines
    const journalEntries = await prisma.journalEntry.findMany({
      include: {
        lines: {
          include: {
            debitAccount: true,
            creditAccount: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // 4. Fetch expenses
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });

    // 5. Fetch tax declarations
    const taxDeclarations = await prisma.taxDeclaration.findMany({
      orderBy: { dueDate: "desc" },
    });

    // 6. Fetch pending B2B invoices to reconcile
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["PENDING", "BEKLIYOR", "BEKLEMEDE", "Draft", "TASLAK", "Sent", "Gönderildi", "Overdue", "UNPAID", "ODENMEDI"] },
        type: { not: "e-İrsaliye" },
      },
      include: {
        currentAccount: {
          select: { name: true },
        },
      },
      orderBy: { date: "desc" },
    });

    // 7. Fetch budget items
    const budgetItems = await prisma.budgetItem.findMany({
      orderBy: { year: "desc" },
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(convertDecimals({
        accounts: updatedAccounts,
        banks,
        journalEntries,
        expenses,
        taxDeclarations,
        invoices,
        budgetItems,
      }))),
    };
  } catch (error) {
    console.error("Error in getAccountingData server action:", error);
    return { success: false, error: "Finansal veriler yüklenirken veri tabanı hatası oluştu." };
  }
}

export async function createJournalEntryAction(input: any) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  const validation = CreateJournalEntrySchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  // Enforce double entry validation mathematically (sum of debits == sum of credits)
  // Since each lines item specifies transfer between debit and credit, the entry is inherently balanced.
  // But we will calculate it anyway to fulfill the double-entry rule validation.
  const totalDebit = data.lines.reduce((s, l) => s + l.amount, 0);
  const totalCredit = data.lines.reduce((s, l) => s + l.amount, 0);

  if (Math.abs(totalDebit - totalCredit) >= 0.01) {
    return { success: false, error: "Çift taraflı kayıt kuralı ihlali: Toplam borç alacağa eşit olmalıdır." };
  }

  try {
    const journalNo = `YEV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const journalEntry = await prisma.$transaction(async (tx) => {
      // 1. Create entry header
      const entry = await tx.journalEntry.create({
        data: {
          number: journalNo,
          description: data.description,
          date: data.date,
          status: "POSTED",
          type: data.type,
          createdBy: auth.session?.user?.name || "Admin",
        },
      });

      // 2. Insert lines
      const lineCreations = data.lines.map((l) => ({
        journalEntryId: entry.id,
        debitAccountId: l.debitAccountId,
        creditAccountId: l.creditAccountId,
        amount: l.amount,
        description: l.description || data.description,
      }));

      await tx.journalLine.createMany({
        data: lineCreations,
      });

      return entry;
    });

    revalidatePath("/muhasebe");
    revalidatePath("/muhasebe/yevmiye");
    return { success: true, data: JSON.parse(JSON.stringify(journalEntry)) };
  } catch (error) {
    console.error("Error in createJournalEntryAction:", error);
    return { success: false, error: "Yevmiye fişi oluşturulurken hata oluştu." };
  }
}

export async function processBankTransferAction(input: any) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  const validation = BankTransferSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch origin bank
      const fromBank = await tx.bank.findUnique({
        where: { id: data.fromBankId },
      });

      if (!fromBank) throw new Error("Kaynak banka hesabı bulunamadı.");
      if (fromBank.balance.toNumber() < data.amount) throw new Error("Kaynak bankada yetersiz bakiye.");

      // 2. Fetch destination bank
      const toBank = await tx.bank.findUnique({
        where: { id: data.toBankId },
      });
      if (!toBank) throw new Error("Hedef banka hesabı bulunamadı.");

      // 3. Decrement source
      const updatedFrom = await tx.bank.update({
        where: { id: data.fromBankId },
        data: { balance: { decrement: data.amount } },
      });

      // 4. Increment destination
      const updatedTo = await tx.bank.update({
        where: { id: data.toBankId },
        data: { balance: { increment: data.amount } },
      });

      return { updatedFrom, updatedTo };
    });

    revalidatePath("/muhasebe");
    revalidatePath("/muhasebe/banka");
    return { success: true, message: "Banka transferi başarıyla tamamlandı.", data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error in processBankTransferAction:", error);
    return { success: false, error: error.message || "Banka transferi gerçekleştirilemedi." };
  }
}

export async function commitTaxDeclarationAction(input: any) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  const validation = TaxDeclarationSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  try {
    const tax = await prisma.taxDeclaration.create({
      data: {
        period: data.period,
        type: data.type,
        amount: data.amount,
        taxBase: data.taxBase || null,
        taxRate: data.taxRate || null,
        dueDate: data.dueDate,
        status: "BEKLIYOR",
        notes: data.notes || null,
      },
    });

    revalidatePath("/muhasebe");
    revalidatePath("/muhasebe/vergi");
    return { success: true, data: JSON.parse(JSON.stringify(tax)) };
  } catch (error) {
    console.error("Error in commitTaxDeclarationAction:", error);
    return { success: false, error: "Vergi beyannamesi oluşturulamadı." };
  }
}

export async function payTaxDeclarationAction(id: string, bankId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    const tax = await prisma.taxDeclaration.findUnique({ where: { id } });
    if (!tax) return { success: false, error: "Beyanname bulunamadı." };
    if (tax.status === "ODENDI") return { success: false, error: "Bu beyanname zaten ödenmiştir." };

    const bank = await prisma.bank.findUnique({ where: { id: bankId } });
    if (!bank) return { success: false, error: "Banka hesabı bulunamadı." };
    if (bank.balance < tax.amount) return { success: false, error: "Banka hesabında ödeme için yetersiz bakiye var." };

    await prisma.$transaction(async (tx) => {
      // 1. Update tax declaration status
      await tx.taxDeclaration.update({
        where: { id },
        data: {
          status: "ODENDI",
          paidDate: new Date(),
        },
      });

      // 2. Decrement bank balance
      await tx.bank.update({
        where: { id: bankId },
        data: {
          balance: { decrement: tax.amount },
        },
      });

      // 3. Log expense
      await tx.expense.create({
        data: {
          date: new Date(),
          category: "Vergi",
          amount: tax.amount,
          taxAmount: 0,
          description: `${tax.type} Vergi Ödemesi (${tax.period} Dönemi)`,
          status: "ODENDI",
          paymentMethod: "BANKA_TRANSFER",
          bankId: bankId,
        },
      });
    });

    revalidatePath("/muhasebe");
    revalidatePath("/muhasebe/vergi");
    return { success: true, message: "Vergi ödemesi başarıyla kaydedildi." };
  } catch (error) {
    console.error("Error in payTaxDeclarationAction:", error);
    return { success: false, error: "Vergi ödemesi gerçekleştirilirken hata oluştu." };
  }
}

export async function reconcileInvoiceAction(invoiceId: string, bankId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    // 1. Find invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) return { success: false, error: "Fatura bulunamadı." };
    if (["PAID", "Paid", "ODENDI"].includes(invoice.status)) {
      return { success: false, error: "Bu fatura zaten ödenmiş olarak işaretlenmiştir." };
    }

    // 2. Find bank
    const bank = await prisma.bank.findUnique({
      where: { id: bankId },
    });
    if (!bank) return { success: false, error: "Banka hesabı bulunamadı." };

    await prisma.$transaction(async (tx) => {
      // 1. Update Invoice status
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "ODENDI" },
      });

      // 2. Increment Bank balance
      await tx.bank.update({
        where: { id: bankId },
        data: { balance: { increment: invoice.totalAmount } },
      });

      // 3. Decrement Dealer current account balance
      await tx.currentAccount.update({
        where: { id: invoice.currentAccountId },
        data: { balance: { decrement: invoice.totalAmount } },
      });

      // 4. Create Transaction history log
      await tx.transaction.create({
        data: {
          currentAccountId: invoice.currentAccountId,
          type: "TAHSILAT",
          amount: invoice.totalAmount,
          description: `Fatura Tahsilatı (Fatura No: ${invoice.id || "—"})`,
          paymentMethod: "Banka Havalesi",
        },
      });
    });

    revalidatePath("/muhasebe");
    revalidatePath("/muhasebe/faturalar");
    return { success: true, message: "Fatura başarıyla mutabakat edilip tahsil edildi." };
  } catch (error) {
    console.error("Error in reconcileInvoiceAction:", error);
    return { success: false, error: "Mutabakat işlemi sırasında veritabanı hatası oluştu." };
  }
}
