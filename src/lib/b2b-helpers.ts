import { prisma, withTimeout } from "./prisma";
import { readLocalOrders } from "./jsonOrderDb";

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
  const normalizeKey = (val: string) => String(val || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // Collect all existing normalized keys & max sequence from local JSON DB
  const localOrders = readLocalOrders();
  const usedKeys = new Set<string>();
  let maxSeq = 0;

  for (const lo of localOrders) {
    for (const raw of [lo.id, lo.orderNumber]) {
      if (!raw) continue;
      const norm = normalizeKey(raw);
      usedKeys.add(norm);
      const m = String(raw).match(/(\d{4})-?(\d+)$/);
      if (m && Number(m[2]) < 900000) {
        maxSeq = Math.max(maxSeq, Number(m[2]));
      }
    }
  }

  try {
    const db = activeTx || prisma;
    const [count, recentOrders] = await Promise.all([
      withTimeout(db.order.count({ where: { type: type } }), 1500, 0),
      withTimeout(db.order.findMany({ select: { id: true }, orderBy: { date: "desc" }, take: 200 }), 1500, []),
    ]);

    for (const o of recentOrders || []) {
      if (!o?.id) continue;
      const norm = normalizeKey(o.id);
      usedKeys.add(norm);
      const m = String(o.id).match(/(\d{4})-?(\d+)$/);
      if (m && Number(m[2]) < 900000) {
        maxSeq = Math.max(maxSeq, Number(m[2]));
      }
    }

    let nextSeq = Math.max(count + 1, maxSeq + 1);
    let customOrderId = `${prefix}-${currentYear}-${String(nextSeq).padStart(6, "0")}`;

    let attempts = 0;
    while (attempts < 50) {
      attempts++;
      const dashed = customOrderId;
      const dashless = normalizeKey(customOrderId);

      if (usedKeys.has(dashless)) {
        nextSeq++;
        customOrderId = `${prefix}-${currentYear}-${String(nextSeq).padStart(6, "0")}`;
        continue;
      }

      const [existingDashed, existingDashless] = await Promise.all([
        withTimeout(db.order.findUnique({ where: { id: dashed }, select: { id: true } }), 1000, null),
        withTimeout(db.order.findUnique({ where: { id: dashless }, select: { id: true } }), 1000, null),
      ]);

      if (!existingDashed && !existingDashless) {
        return customOrderId;
      }

      usedKeys.add(dashless);
      nextSeq++;
      customOrderId = `${prefix}-${currentYear}-${String(nextSeq).padStart(6, "0")}`;
    }

    return `${prefix}-${currentYear}-${Date.now().toString().slice(-6)}`;
  } catch (err) {
    console.warn("[GENERATE ORDER ID WARNING] DB erişilemedi, fallback sipariş kodu üretiliyor:", err);
    const nextSeq = maxSeq + 1;
    let candidate = `${prefix}-${currentYear}-${String(nextSeq).padStart(6, "0")}`;
    if (usedKeys.has(normalizeKey(candidate))) {
      candidate = `${prefix}-${currentYear}-${Date.now().toString().slice(-6)}`;
    }
    return candidate;
  }
}
