import { prisma, withTimeout } from "@/lib/prisma";
import { readLocalOrders, updateLocalOrderStatus } from "@/lib/jsonOrderDb";
import { restoreLocalProductStock } from "@/lib/jsonProductDb";
import { emailNotificationService } from "@/lib/email-notification-service";

export interface CancelOrderParams {
  rawId: string;
  targetStatus?: string;
  reason?: string;
  userId?: string | null;
  userEmail?: string | null;
}

export interface CancelOrderResult {
  id: string;
  dbId: string | null;
  success: boolean;
  dbUpdated: boolean;
  localUpdated: boolean;
  alreadyCancelled: boolean;
  stockRestoredCount: number;
  ledgerReversed: boolean;
  error?: string;
}

function normalizeKey(val: string): string {
  return String(val || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function parseSummaryItems(summaryText: string): Array<{ name: string; quantity: number }> {
  if (!summaryText) return [];
  const cleaned = String(summaryText).replace(/^\[[^\]]+\]\s*/, "").trim();
  if (!cleaned) return [];

  const parts = cleaned.split(",").map(s => s.trim()).filter(Boolean);
  const items: Array<{ name: string; quantity: number }> = [];

  for (const part of parts) {
    const m = part.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (m) {
      items.push({ name: m[1].trim(), quantity: Math.max(1, Number(m[2])) });
    } else {
      items.push({ name: part, quantity: 1 });
    }
  }
  return items;
}

export async function cancelOrderWithSideEffects({
  rawId,
  targetStatus = "İptal Edildi",
  reason = "",
  userId = null,
  userEmail = null,
}: CancelOrderParams): Promise<CancelOrderResult> {
  const dashless = normalizeKey(rawId);
  const localOrders = readLocalOrders();
  const matchedLocal = localOrders.find(
    o => normalizeKey(o.id) === dashless || (o.orderNumber && normalizeKey(o.orderNumber) === dashless)
  );

  let existingOrder: any = null;
  let updatedOrder: any = null;
  let dbReachable = false;

  try {
    existingOrder = await withTimeout(
      prisma.order.findUnique({
        where: { id: rawId },
        include: { currentAccount: true },
      }),
      6000,
      undefined as any
    );
    if (existingOrder !== undefined) dbReachable = true;
    if (existingOrder === undefined) existingOrder = null;

    if (!existingOrder && dashless && dashless !== rawId) {
      const byDashless = await withTimeout(
        prisma.order.findUnique({
          where: { id: dashless },
          include: { currentAccount: true },
        }),
        6000,
        undefined as any
      );
      if (byDashless !== undefined) dbReachable = true;
      if (byDashless) existingOrder = byDashless;
    }

    // Eski formatlı ID'ler için (ör: DB id "4" -> UI orderNumber "PKF-2026-000004") esnek eşleştirme
    if (!existingOrder) {
      const suffixMatch = String(rawId).match(/^(?:PKF|B2B|B2C|ORD)-?\d{4}-?([A-Z0-9]+)$/i);
      const targetSuffix = suffixMatch ? suffixMatch[1].toUpperCase() : null;
      const targetUnpadded = targetSuffix ? targetSuffix.replace(/^0+/, "") : null;

      const candidates = await withTimeout(
        prisma.order.findMany({
          select: { id: true },
          orderBy: { date: "desc" },
          take: 500,
        }),
        6000,
        null as any
      );

      if (Array.isArray(candidates)) {
        dbReachable = true;
        const foundCandidate = candidates.find(c => {
          const clean = normalizeKey(c.id);
          if (clean === dashless) return true;
          if (targetSuffix) {
            const padded = clean.length > 6 ? clean.slice(-6) : clean.padStart(6, "0");
            if (padded === targetSuffix) return true;
            if (targetUnpadded && clean === targetUnpadded) return true;
          }
          return false;
        });

        if (foundCandidate) {
          existingOrder = await withTimeout(
            prisma.order.findUnique({
              where: { id: foundCandidate.id },
              include: { currentAccount: true },
            }),
            6000,
            null
          );
        }
      }
    }
  } catch (findErr) {
    console.warn("[ORDER CANCEL FIND WARN]:", findErr);
  }

  const wasAlreadyCancelled =
    /iptal|iade/i.test(String(existingOrder?.status || "")) ||
    (!existingOrder && /iptal|iade/i.test(String(matchedLocal?.status || "")));

  let ledgerReversed = false;
  let stockRestoredCount = 0;
  let dbErrorMsg: string | undefined;

  // 1) MySQL Sipariş Durumunu Güncelle (doğrudan ve güvenilir şekilde)
  if (existingOrder) {
    const dbId = existingOrder.id;
    try {
      updatedOrder = await withTimeout(
        prisma.order.update({
          where: { id: dbId },
          data: { status: targetStatus },
          include: { currentAccount: true },
        }),
        8000,
        null
      );
    } catch (updErr: any) {
      dbErrorMsg = updErr?.message || "Veritabanı sipariş durumu güncellenemedi.";
      console.error("[ORDER CANCEL DB UPDATE ERROR]:", updErr);
    }

    // 2) Cari Hesap Ters Kayıt (IPTAL / IADE) — İdempotent ve güvenli
    const txType = /iade/i.test(targetStatus) ? "IADE" : "IPTAL";
    const reverseAmount = Number(existingOrder.total || matchedLocal?.amount || 0);

    if (updatedOrder && !wasAlreadyCancelled && existingOrder.currentAccountId && reverseAmount > 0) {
      try {
        const descConditions: any[] = [{ description: { contains: `#${rawId}` } }];
        if (dbId && dbId !== rawId) {
          descConditions.push({ description: { contains: `#${dbId}` } });
        }

        const existingTx = await withTimeout(
          prisma.transaction.findFirst({
            where: {
              currentAccountId: existingOrder.currentAccountId,
              type: { in: ["IPTAL", "IADE"] },
              OR: descConditions,
            },
          }),
          4000,
          null
        );

        if (!existingTx) {
          await withTimeout(
            prisma.transaction.create({
              data: {
                currentAccountId: existingOrder.currentAccountId,
                type: txType,
                amount: -reverseAmount,
                description: `Sipariş İptali: #${rawId}${reason ? ` (${reason})` : ""}`,
                paymentMethod: existingOrder.method || "Belirtilmedi",
                date: new Date(),
              },
            }),
            5000,
            null
          );

          await withTimeout(
            prisma.currentAccount.update({
              where: { id: existingOrder.currentAccountId },
              data: { balance: { decrement: reverseAmount } },
            }),
            5000,
            null
          );
          ledgerReversed = true;
        }
      } catch (ledgerErr) {
        console.error("[ORDER CANCEL LEDGER ERROR]:", ledgerErr);
      }
    }
  } else if (matchedLocal && dbReachable && !wasAlreadyCancelled) {
    // Sipariş yalnızca JSON'daysa bile cari hesabı bulup IPTAL hareketi işle
    try {
      const reverseAmount = Number(matchedLocal.amount || matchedLocal.total || 0);
      if (reverseAmount > 0) {
        let acc = matchedLocal.currentAccountId
          ? await withTimeout(prisma.currentAccount.findUnique({ where: { id: matchedLocal.currentAccountId } }), 4000, null)
          : null;
        if (!acc && matchedLocal.email) {
          acc = await withTimeout(prisma.currentAccount.findFirst({ where: { email: matchedLocal.email } }), 4000, null);
        }
        if (acc) {
          const existingTx = await withTimeout(
            prisma.transaction.findFirst({
              where: {
                currentAccountId: acc.id,
                type: { in: ["IPTAL", "IADE"] },
                description: { contains: `#${rawId}` },
              },
            }),
            4000,
            null
          );
          if (!existingTx) {
            await withTimeout(
              prisma.transaction.create({
                data: {
                  currentAccountId: acc.id,
                  type: /iade/i.test(targetStatus) ? "IADE" : "IPTAL",
                  amount: -reverseAmount,
                  description: `Sipariş İptali: #${rawId}${reason ? ` (${reason})` : ""}`,
                  paymentMethod: matchedLocal.method || "Belirtilmedi",
                  date: new Date(),
                },
              }),
              5000,
              null
            );
            await withTimeout(
              prisma.currentAccount.update({
                where: { id: acc.id },
                data: { balance: { decrement: reverseAmount } },
              }),
              5000,
              null
            );
            ledgerReversed = true;
          }
        }
      }
    } catch (jsonLedgerErr) {
      console.warn("[ORDER CANCEL JSON LEDGER WARN]:", jsonLedgerErr);
    }
  }

  // 3) Yerel JSON sipariş kaydını daima güncelle
  const localUpdated =
    updateLocalOrderStatus(rawId, { status: targetStatus }) ||
    (existingOrder?.id && existingOrder.id !== rawId
      ? updateLocalOrderStatus(existingOrder.id, { status: targetStatus })
      : null);

  // 4) Stok iadesi & StockTransaction hareketi (yalnızca ilk iptal anında)
  if (!wasAlreadyCancelled && (updatedOrder || localUpdated)) {
    const itemsToRestore: Array<any> =
      Array.isArray(matchedLocal?.items) && matchedLocal.items.length > 0
        ? matchedLocal.items
        : parseSummaryItems(existingOrder?.summary || matchedLocal?.summary || "");

    for (const item of itemsToRestore) {
      const qty = Math.max(1, Number(item.quantity || 1));
      if (restoreLocalProductStock(item, qty)) {
        stockRestoredCount++;
      }

      try {
        const targetId = String(item.productId || item.id || "").split("_")[0].trim();
        const targetSku = String(item.sku || "").trim();
        const targetName = String(item.name || "").replace(/\s*\([^)]*\)/g, "").trim();

        let dbProduct = null;
        if (targetId) {
          dbProduct = await withTimeout(
            prisma.product.findFirst({ where: { OR: [{ id: targetId }, { sku: targetId }] } }),
            3000,
            null
          );
        }
        if (!dbProduct && targetSku) {
          dbProduct = await withTimeout(
            prisma.product.findFirst({ where: { sku: targetSku } }),
            3000,
            null
          );
        }
        if (!dbProduct && targetName) {
          dbProduct = await withTimeout(
            prisma.product.findFirst({ where: { name: { contains: targetName } } }),
            3000,
            null
          );
        }

        if (dbProduct) {
          await withTimeout(
            prisma.product.update({
              where: { id: dbProduct.id },
              data: { stock: { increment: qty } },
            }),
            3000,
            null
          );

          await withTimeout(
            prisma.stockTransaction.create({
              data: {
                productId: dbProduct.id,
                type: "RETURN",
                quantity: qty,
                description: `Sipariş İptali Stok İadesi (#${rawId})${reason ? ` - ${reason}` : ""}`,
                moduleSource: "ORDER_CANCEL",
                referenceId: existingOrder?.id || rawId,
                userId: userId || undefined,
                userEmail: userEmail || undefined,
              },
            }),
            3000,
            null
          );
        }
      } catch (stockErr) {
        console.warn("[ORDER CANCEL STOCK RESTORE WARN]:", stockErr);
      }
    }
  }

  // 5) Müşteri bilgilendirme e-postası
  const customerEmail = updatedOrder?.currentAccount?.email || existingOrder?.currentAccount?.email || localUpdated?.email;
  if (!wasAlreadyCancelled && (updatedOrder || localUpdated) && customerEmail && customerEmail !== "guest@nexab2b.com") {
    emailNotificationService
      .queueEmail(customerEmail, "order_status_updated", {
        kullanici_adi: existingOrder?.currentAccount?.name || localUpdated?.client || "Değerli Müşterimiz",
        siparis_no: rawId,
        siparis_durumu: targetStatus,
        siparis_tutari: Number(existingOrder?.total || localUpdated?.amount || 0).toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        }),
        kargo_sirketi: "—",
        takip_no: "—",
        tarih: new Date().toLocaleDateString("tr-TR"),
        detay_linki: `${process.env.NEXTAUTH_URL || "https://pekefe.com"}/hesap`,
      })
      .catch(() => {});
  }

  // Eğer sipariş MySQL'de mevcutsa, MySQL güncellemesi başarısız olduğunda sahte "başarılı" döndürme!
  const success = existingOrder ? Boolean(updatedOrder) : Boolean(localUpdated);

  return {
    id: rawId,
    dbId: existingOrder?.id || null,
    success,
    dbUpdated: Boolean(updatedOrder),
    localUpdated: Boolean(localUpdated),
    alreadyCancelled: wasAlreadyCancelled,
    stockRestoredCount,
    ledgerReversed,
    error: !success ? (dbErrorMsg || "Sipariş veritabanında güncellenemedi.") : undefined,
  };
}
