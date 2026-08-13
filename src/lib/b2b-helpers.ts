import { prisma } from "./prisma";

/**
 * Oturum açmış kullanıcının e-posta adresinden parent Cari Hesap (CurrentAccount) bilgisini döner.
 * Kullanıcı ana bayi hesabı veya bir alt hesap (SubAccount) olabilir.
 * 
 * @param email Oturum açmış kullanıcının e-posta adresi
 */
export async function getCariAccountByEmail(email: string | null | undefined) {
  if (!email) return null;

  // 1. Doğrudan Cari Hesap (CurrentAccount) tablosunda ara
  let account = await prisma.currentAccount.findFirst({
    where: {
      email,
      isDeleted: false,
      isActive: true
    }
  });

  if (account) return account;

  // 2. Alt Hesap (SubAccount) tablosunda ara ve ilişkili cariyi çek
  const subAccount = await prisma.subAccount.findUnique({
    where: { email },
    include: {
      currentAccount: true
    }
  });

  if (
    subAccount &&
    subAccount.currentAccount &&
    !subAccount.currentAccount.isDeleted &&
    subAccount.currentAccount.isActive
  ) {
    return subAccount.currentAccount;
  }

  return null;
}

/**
 * Bir kullanıcının B2B (Bayi) kapsamında olup olmadığını kontrol eder.
 * 
 * @param user Oturum açmış kullanıcı nesnesi
 */
export function isB2B(user: any): boolean {
  if (!user) return false;
  return user.customer_type === "b2b" || user.role === "DEALER";
}

/**
 * Generates a unique, professional sequential order ID based on order type (B2B or B2C).
 * Format: [TYPE]-YYYY-XXXXXX (e.g. B2B-2026-000042 or B2C-2026-000042)
 */
export async function generateNextOrderId(typeOrTx?: any, tx?: any): Promise<string> {
  let type: "B2B" | "B2C" | "SATIN_ALMA" = "B2B";
  let activeTx = tx;

  if (typeof typeOrTx === "string") {
    type = typeOrTx as any;
  } else if (typeOrTx) {
    activeTx = typeOrTx;
  }

  const currentYear = new Date().getFullYear();
  const prefix = type === "B2B" ? "B2B" : "PKF";

  try {
    const db = activeTx || prisma;
    const count = await db.order.count({
      where: { type: type }
    });
    
    let nextSeq = count + 1;
    let customOrderId = `${prefix}-${currentYear}-${String(nextSeq).padStart(6, '0')}`;
    
    let isIdUnique = false;
    while (!isIdUnique) {
      const existing = await db.order.findUnique({ where: { id: customOrderId } });
      if (!existing) {
        isIdUnique = true;
      } else {
        nextSeq++;
        customOrderId = `${prefix}-${currentYear}-${String(nextSeq).padStart(6, '0')}`;
      }
    }
    return customOrderId;
  } catch (err) {
    console.warn("[GENERATE ORDER ID WARNING] DB erişilemedi, fallback sipariş kodu üretiliyor:", err);
    return `${prefix}-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
