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
  alreadyCancelled: boolean;
  stockRestoredCount: number;
  ledgerReversed: boolean;
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

  try {
    existingOrder = await withTimeout(
      prisma.order.findUnique({
        where: { id: rawId },
        include: { currentAccount: true },
      }),
      2000,
      null
    );

    if (!existingOrder && dashless && dashless !== rawId) {
      existingOrder = await withTimeout(
        prisma.order.findUnique({
          where: { id: dashless },
          include: { currentAccount: true },
        }),
        2000,
        null
      );
    }

    // Eski formatlı ID'ler için (ör: DB id "4" -> UI orderNumber "PKF-2026-000004") esnek eşleştirme
    if (!existingOrder) {
      const suffixMatch = String(rawId).match(/^(?:PKF|B2B|B2C|ORD)-?\d{4}-?([A-Z0-9]+)$/i);
      const targetSuffix = suffixMatch ? suffixMatch[1].toUpperCase() : null;

      const candidates = await withTimeout(
        prisma.order.findMany({
          where: { isDeleted: false },
          select: { id: true },
          orderBy: { date: "desc" },
          take: 250,
        }),
        2000,
        []
      );

      const foundCandidate = candidates.find(c => {
        const clean = normalizeKey(c.id);
        if (clean === dashless) return true;
        if (targetSuffix) {
          const padded = clean.length > 6 ? clean.slice(-6) : clean.padStart(6, "0");
          return padded === targetSuffix;
        }
        return false;
      });

      if (foundCandidate) {
        existingOrder = await withTimeout(
          prisma.order.findUnique({
            where: { id: foundCandidate.id },
            include: { currentAccount: true },
          }),
          2000,
          null
        );
      }
    }
  } catch (findErr) {
    console.warn("[ORDER CANCEL FIND WARN]:", findErr);
  }

  const wasAlreadyCancelled =
    /iptal|iade/i.test(String(existingOrder?.status || "")) ||
    /iptal|iade/i.test(String(matchedLocal?.status || ""));

  let ledgerReversed = false;
  let stockRestoredCount = 0;

  if (existingOrder) {
    const dbId = existingOrder.id;
    const txType = /iade/i.test(targetStatus) ? "IADE" : "IPTAL";
    const reverseAmount = Number(existingOrder.total || matchedLocal?.amount || 0);

    try {
      updatedOrder = await withTimeout(
        prisma.$transaction(async (tx) => {
          const order = await tx.order.update({
            where: { id: dbId },
            data: { status: targetStatus },
          });

          if (!wasAlreadyCancelled && existingOrder.currentAccountId && reverseAmount > 0) {
            const existingTx = await tx.transaction.findFirst({
              where: {
                currentAccountId: existingOrder.currentAccountId,
                type: { in: ["IPTAL", "IADE"] },
                OR: [
                  { description: { contains: dbId } },
                  { description: { contains: rawId } },
                ],
              },
            });

            if (!existingTx) {
              await tx.transaction.create({
                data: {
                  currentAccountId: existingOrder.currentAccountId,
                  type: txType,
                  amount: -reverseAmount,
                  description: `Sipariş İptali: #${rawId}${reason ? ` (${reason})` : ""}`,
                  paymentMethod: existingOrder.method || "Belirtilmedi",
                  date: new Date(),
                },
              });

              await tx.currentAccount.update({
                where: { id: existingOrder.currentAccountId },
                data: { balance: { decrement: reverseAmount } },
              });
              ledgerReversed = true;
            }
          }

          return order;
        }),
        4500,
        null
      );
    } catch (txErr) {
      console.warn("[ORDER CANCEL TX WARN]:", txErr);
    }

    if (!updatedOrder) {
      try {
        updatedOrder = await withTimeout(
          prisma.order.update({
            where: { id: dbId },
            data: { status: targetStatus },
          }),
          2000,
          null
        );
      } catch (fallbackErr) {
        console.warn("[ORDER CANCEL FALLBACK UPDATE WARN]:", fallbackErr);
      }
    }
  }

  // Yerel JSON sipariş kaydını daima güncelle
  const localUpdated =
    updateLocalOrderStatus(rawId, { status: targetStatus }) ||
    (existingOrder?.id && existingOrder.id !== rawId
      ? updateLocalOrderStatus(existingOrder.id, { status: targetStatus })
      : null);

  // Stok iadesi & StockTransaction hareketi (yalnızca ilk iptal anında)
  if (!wasAlreadyCancelled) {
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
            1500,
            null
          );
        }
        if (!dbProduct && targetSku) {
          dbProduct = await withTimeout(
            prisma.product.findFirst({ where: { sku: targetSku } }),
            1500,
            null
          );
        }
        if (!dbProduct && targetName) {
          dbProduct = await withTimeout(
            prisma.product.findFirst({ where: { name: { contains: targetName } } }),
            1500,
            null
          );
        }

        if (dbProduct) {
          await withTimeout(
            prisma.product.update({
              where: { id: dbProduct.id },
              data: { stock: { increment: qty } },
            }),
            1500,
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
            1500,
            null
          );
        }
      } catch (stockErr) {
        console.warn("[ORDER CANCEL STOCK RESTORE WARN]:", stockErr);
      }
    }
  }

  // Müşteri bilgilendirme e-postası
  const customerEmail = updatedOrder?.currentAccount?.email || existingOrder?.currentAccount?.email || localUpdated?.email;
  if (!wasAlreadyCancelled && customerEmail && customerEmail !== "guest@nexab2b.com") {
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

  return {
    id: rawId,
    dbId: existingOrder?.id || null,
    success: Boolean(updatedOrder || localUpdated),
    alreadyCancelled: wasAlreadyCancelled,
    stockRestoredCount,
    ledgerReversed,
  };
}
