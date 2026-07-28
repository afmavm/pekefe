import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated-client";
import { Decimal } from "../../../generated-client/runtime/library";

export interface JournalLineInput {
  debitAccountCode: string;
  creditAccountCode: string;
  amount: number | Decimal | string;
  description?: string;
}

// Tek Düzen Hesap Planı (TDHP) Tanım Kataloğu
const ACCOUNT_CATALOG: Record<string, { name: string; type: string }> = {
  "100": { name: "Kasa Hesabı", type: "AKTIF" },
  "102": { name: "Bankalar Hesabı", type: "AKTIF" },
  "120": { name: "Alıcılar Hesabı", type: "AKTIF" },
  "153": { name: "Ticari Mallar Hesabı", type: "AKTIF" },
  "191": { name: "İndirilecek KDV Hesabı", type: "AKTIF" },
  "320": { name: "Satıcılar Hesabı", type: "PASIF" },
  "391": { name: "Hesaplanan KDV Hesabı", type: "PASIF" },
  "600": { name: "Yurtiçi Satışlar Hesabı", type: "GELIR" },
};

/**
 * Hesap kodunu çözümler, eğer sistemde yoksa otomatik oluşturur (Seed/Entegrasyon kolaylığı için).
 */
export async function getOrCreateAccount(tx: Prisma.TransactionClient, code: string) {
  const account = await tx.accountingAccount.findUnique({
    where: { code },
  });

  if (account) return account;

  const catalogInfo = ACCOUNT_CATALOG[code] || { name: `${code} No'lu Hesap`, type: "AKTIF" };

  return await tx.accountingAccount.create({
    data: {
      code,
      name: catalogInfo.name,
      type: catalogInfo.type,
      isActive: true,
    },
  });
}

/**
 * Çift taraflı kayıt kurallarına (Debit = Credit) uygun şekilde veritabanında Yevmiye Fişi ve Satırları oluşturur.
 */
export async function createJournalEntry(
  tx: Prisma.TransactionClient,
  type: string,
  referenceId: string | null,
  date: Date,
  description: string,
  lines: JournalLineInput[],
  companyId?: string | null
) {
  if (lines.length === 0) {
    throw new Error("Muhasebe fişinde en az bir satır bulunmalıdır.");
  }

  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  // Borç / Alacak ve Tutar doğrulama
  for (const line of lines) {
    const amountDec = new Decimal(line.amount.toString());
    if (amountDec.isNegative() || amountDec.isZero()) {
      throw new Error(`Geçersiz işlem tutarı: ${line.amount}. Tutar sıfırdan büyük olmalıdır.`);
    }
    totalDebit = totalDebit.plus(amountDec);
    totalCredit = totalCredit.plus(amountDec);
  }

  // Fiş bazında Borç / Alacak Dengesi Kontrolü (Strict Double-Entry Rule)
  if (!totalDebit.equals(totalCredit)) {
    throw new Error(`Çift taraflı kayıt hatası: Borç toplamı (${totalDebit}) Alacak toplamına (${totalCredit}) eşit değil.`);
  }

  // Benzersiz yevmiye numarası oluştur (Örn: YVM-YYYY-TIMESTAMP-RANDOM)
  const timestamp = Date.now();
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  const journalNumber = `YVM-${date.getFullYear()}-${timestamp}-${randomNumber}`;

  // 1. JournalEntry Başlığı Oluştur
  const entry = await tx.journalEntry.create({
    data: {
      number: journalNumber,
      date: date,
      description: description,
      type: type,
      referenceId: referenceId,
      status: "APPROVED",
      companyId: companyId || null,
    },
  });

  // 2. JournalLine Satırları Oluştur
  for (const line of lines) {
    const debitAccount = await getOrCreateAccount(tx, line.debitAccountCode);
    const creditAccount = await getOrCreateAccount(tx, line.creditAccountCode);

    await tx.journalLine.create({
      data: {
        journalEntryId: entry.id,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        amount: new Decimal(line.amount.toString()),
        description: line.description || description,
      },
    });
  }

  return entry;
}

/**
 * A. Satış Faturası Kesildiğinde (Event Hook)
 * - 120 (Alıcılar) -> Fatura Genel Toplamı BORÇ
 * - 600 (Yurtiçi Satışlar) -> Matrah ALACAK
 * - 391 (Hesaplanan KDV) -> KDV ALACAK
 */
export async function postSalesInvoice(invoice: any, tx: Prisma.TransactionClient) {
  const companyId = invoice.companyId;
  const date = new Date(invoice.date);
  const description = `${invoice.id} No'lu Satış Faturası Muhasebe Kaydı`;

  const total = new Decimal(invoice.totalAmount.toString());
  const tax = new Decimal(invoice.taxAmount.toString());
  const subtotal = total.minus(tax);

  const lines: JournalLineInput[] = [];

  // Matrah Kaydı
  if (subtotal.greaterThan(0)) {
    lines.push({
      debitAccountCode: "120",
      creditAccountCode: "600",
      amount: subtotal,
      description: `${invoice.id} No'lu Fatura - Matrah Satışı`,
    });
  }

  // KDV Kaydı
  if (tax.greaterThan(0)) {
    lines.push({
      debitAccountCode: "120",
      creditAccountCode: "391",
      amount: tax,
      description: `${invoice.id} No'lu Fatura - Hesaplanan KDV`,
    });
  }

  return await createJournalEntry(tx, "SALES", invoice.id, date, description, lines, companyId);
}

/**
 * B. Alış Faturası İşlendiğinde (Event Hook)
 * - 153 (Ticari Mallar) -> Matrah BORÇ
 * - 191 (İndirilecek KDV) -> KDV BORÇ
 * - 320 (Satıcılar) -> Fatura Genel Toplamı ALACAK
 */
export async function postPurchaseInvoice(invoice: any, tx: Prisma.TransactionClient) {
  const companyId = invoice.companyId;
  const date = new Date(invoice.date);
  const description = `${invoice.id} No'lu Alış Faturası Muhasebe Kaydı`;

  const total = new Decimal(invoice.totalAmount.toString());
  const tax = new Decimal(invoice.taxAmount.toString());
  const subtotal = total.minus(tax);

  const lines: JournalLineInput[] = [];

  // Stok Giriş Kaydı
  if (subtotal.greaterThan(0)) {
    lines.push({
      debitAccountCode: "153",
      creditAccountCode: "320",
      amount: subtotal,
      description: `${invoice.id} No'lu Fatura - Stok Girişi`,
    });
  }

  // KDV Kaydı
  if (tax.greaterThan(0)) {
    lines.push({
      debitAccountCode: "191",
      creditAccountCode: "320",
      amount: tax,
      description: `${invoice.id} No'lu Fatura - İndirilecek KDV`,
    });
  }

  return await createJournalEntry(tx, "PURCHASE", invoice.id, date, description, lines, companyId);
}

/**
 * C. Tedarikçiye Ödeme Yapıldığında (Event Hook)
 * - 320 (Satıcılar) -> Ödeme Tutarı BORÇ (Borcumuz azalır)
 * - 102 (Banka) veya 100 (Kasa) -> Ödeme Tutarı ALACAK
 */
export async function postPayment(transaction: any, tx: Prisma.TransactionClient) {
  const companyId = transaction.companyId;
  const date = new Date(transaction.date);
  const description = `${transaction.id} No'lu Ödeme Muhasebe Kaydı`;

  const amount = new Decimal(transaction.amount.toString());
  const paymentMethod = transaction.paymentMethod || "HAVALE";

  // NAKIT ise Kasa (100), diğerleri ise Banka (102) alacaklandırılır
  const creditAccountCode = paymentMethod.toUpperCase() === "NAKIT" ? "100" : "102";

  const lines: JournalLineInput[] = [{
    debitAccountCode: "320",
    creditAccountCode: creditAccountCode,
    amount: amount,
    description: `${transaction.id} No'lu İşlem - Tedarikçi Ödemesi (${paymentMethod})`,
  }];

  return await createJournalEntry(tx, "PAYMENT", transaction.id, date, description, lines, companyId);
}
