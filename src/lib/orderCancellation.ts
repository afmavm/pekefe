import { prisma, withTimeout } from "@/lib/prisma";
import { readLocalOrders, updateLocalOrderStatus } from "@/lib/jsonOrderDb";
import { restoreLocalProductStock } from "@/lib/jsonProductDb";
import { emailNotificationService } from "@/lib/email-notification-service";
import { WhatsAppNotificationService } from "@/lib/whatsapp-service";

export interface CancelOrderParams {
  rawId: string;
  orderNumber?: string;
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
  loyaltyReversedPoints: number;
  invoicesCancelled: number;
  requiresPaymentRefund: boolean;
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
  orderNumber,
  targetStatus = "İptal Edildi",
  reason = "",
  userId = null,
  userEmail = null,
}: CancelOrderParams): Promise<CancelOrderResult> {
  const displayOrderNo = orderNumber || rawId;
  const dashless = normalizeKey(rawId);
  const displayNorm = normalizeKey(displayOrderNo);
  const localOrders = readLocalOrders();
  const matchedLocal = localOrders.find(
    o =>
      normalizeKey(o.id) === dashless ||
      normalizeKey(o.id) === displayNorm ||
      (o.orderNumber && (normalizeKey(o.orderNumber) === dashless || normalizeKey(o.orderNumber) === displayNorm))
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
  let loyaltyReversedPoints = 0;
  let invoicesCancelled = 0;
  let dbErrorMsg: string | undefined;

  const effectiveMethod = String(existingOrder?.method || matchedLocal?.method || "");
  const requiresPaymentRefund = /kredi|kart|paytr|online/i.test(effectiveMethod);

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

  // 3) Yerel JSON sipariş kaydını daima güncelle (iptal nedeni ve zamanı dahil)
  const localPatch: any = {
    status: targetStatus,
    ...(reason && reason.trim() ? { cancelReason: reason.trim() } : {}),
    cancelledAt: new Date().toISOString(),
  };
  const localUpdated =
    updateLocalOrderStatus(rawId, localPatch) ||
    (displayOrderNo !== rawId ? updateLocalOrderStatus(displayOrderNo, localPatch) : null) ||
    (existingOrder?.id && existingOrder.id !== rawId
      ? updateLocalOrderStatus(existingOrder.id, localPatch)
      : null);

  // 3.5) Sadakat Puanı Geri Alımı (CurrentAccount.loyaltyPoints) + Kesilmiş Fatura İptali
  if (!wasAlreadyCancelled && (updatedOrder || localUpdated)) {
    const reverseAmount = Number(existingOrder?.total || matchedLocal?.amount || matchedLocal?.total || 0);
    const pointsToDeduct = Math.max(0, Math.floor(reverseAmount));

    if (pointsToDeduct > 0) {
      try {
        let targetAcc: any = existingOrder?.currentAccount || null;
        if (!targetAcc && existingOrder?.currentAccountId) {
          targetAcc = await withTimeout(
            prisma.currentAccount.findUnique({ where: { id: existingOrder.currentAccountId } }),
            3000,
            null
          );
        }
        if (!targetAcc && matchedLocal?.email) {
          targetAcc = await withTimeout(
            prisma.currentAccount.findFirst({ where: { email: matchedLocal.email } }),
            3000,
            null
          );
        }
        if (targetAcc && typeof targetAcc.loyaltyPoints === "number" && targetAcc.loyaltyPoints > 0) {
          const nextPoints = Math.max(0, Number(targetAcc.loyaltyPoints || 0) - pointsToDeduct);
          const actualDeducted = Number(targetAcc.loyaltyPoints || 0) - nextPoints;
          await withTimeout(
            prisma.currentAccount.update({
              where: { id: targetAcc.id },
              data: { loyaltyPoints: nextPoints },
            }),
            4000,
            null
          );
          loyaltyReversedPoints = actualDeducted;
        }
      } catch (loyaltyErr) {
        console.warn("[ORDER CANCEL LOYALTY WARN]:", loyaltyErr);
      }
    }

    // Sipariş için kesilmiş aktif fatura varsa IPTAL/IADE olarak işaretle
    if (existingOrder?.id) {
      try {
        const activeInvoices = await withTimeout(
          prisma.invoice.findMany({
            where: {
              orderId: existingOrder.id,
              status: { notIn: ["IPTAL", "IADE", "İptal", "İade"] },
            },
            select: { id: true, notes: true },
          }),
          3000,
          []
        );
        const invStatus = /iade/i.test(targetStatus) ? "IADE" : "IPTAL";
        for (const inv of activeInvoices || []) {
          await withTimeout(
            prisma.invoice.update({
              where: { id: inv.id },
              data: {
                status: invStatus,
                notes: `${inv.notes ? `${inv.notes} | ` : ""}Sipariş iptali ile ${invStatus} edildi (#${displayOrderNo})`,
              },
            }),
            3000,
            null
          );
          invoicesCancelled += 1;
        }
      } catch (invErr) {
        console.warn("[ORDER CANCEL INVOICE WARN]:", invErr);
      }
    }
  }

  // 4) Stok iadesi (Product.stock + StockLocation depo stoğu + StockTransaction hareketi)
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

          // Depo lokasyon stoğunu (StockLocation) da senkronize artır
          let restoredWarehouseId: string | undefined;
          try {
            const loc = await withTimeout(
              prisma.stockLocation.findFirst({
                where: { productId: dbProduct.id },
                orderBy: { stock: "desc" },
              }),
              2500,
              null
            );
            if (loc) {
              await withTimeout(
                prisma.stockLocation.update({
                  where: { id: loc.id },
                  data: { stock: { increment: qty } },
                }),
                2500,
                null
              );
              restoredWarehouseId = loc.warehouseId;
            }
          } catch (locErr) {
            console.warn("[ORDER CANCEL STOCK LOCATION WARN]:", locErr);
          }

          await withTimeout(
            prisma.stockTransaction.create({
              data: {
                productId: dbProduct.id,
                warehouseId: restoredWarehouseId,
                type: "RETURN",
                quantity: qty,
                description: `Sipariş İptali Stok İadesi (#${displayOrderNo})${reason ? ` - ${reason}` : ""}`,
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

  // 5) Müşteri bilgilendirme e-postası & WhatsApp bildirimi
  const customerEmail = updatedOrder?.currentAccount?.email || existingOrder?.currentAccount?.email || localUpdated?.email || matchedLocal?.email;
  const customerPhone = updatedOrder?.currentAccount?.phone || existingOrder?.currentAccount?.phone || localUpdated?.phone || matchedLocal?.phone;
  const customerName = existingOrder?.currentAccount?.name || localUpdated?.client || matchedLocal?.client || "Değerli Müşterimiz";
  const cancelReasonText = reason && reason.trim().length > 0
    ? reason.trim()
    : "Siparişiniz müşteri talebi veya operasyonel değerlendirme doğrultusunda iptal edilmiştir.";

  if (!wasAlreadyCancelled && (updatedOrder || localUpdated) && customerEmail && customerEmail !== "guest@nexab2b.com") {
    const cleanSummary = String(existingOrder?.summary || localUpdated?.summary || matchedLocal?.summary || "Sipariş kalemleri")
      .replace(/^\[[^\]]+\]\s*/, "")
      .trim();

    emailNotificationService
      .queueEmail(customerEmail, "order_cancelled", {
        kullanici_adi: customerName,
        siparis_no: displayOrderNo,
        iptal_nedeni: cancelReasonText,
        siparis_ozeti: cleanSummary || "Sipariş kalemleri",
        siparis_tutari: Number(existingOrder?.total || localUpdated?.amount || matchedLocal?.amount || 0).toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        }),
        odeme_yontemi: effectiveMethod || "Belirtilmedi",
        tarih: new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        detay_linki: `${process.env.NEXTAUTH_URL || "https://www.pekefe.com"}/hesap`,
      })
      .catch(() => {});
  }

  if (!wasAlreadyCancelled && (updatedOrder || localUpdated) && customerPhone) {
    const amountFmt = Number(existingOrder?.total || localUpdated?.amount || matchedLocal?.amount || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
    });
    const waText =
      `🌿 *PEKEFE — Sipariş İptal Bildirimi*\n\n` +
      `Sayın ${customerName},\n` +
      `*#${displayOrderNo}* numaralı (₺${amountFmt}) siparişiniz *${targetStatus}* olarak güncellenmiştir.\n` +
      `📌 *Açıklama:* ${cancelReasonText}\n\n` +
      (requiresPaymentRefund
        ? `💳 Kredi kartı ödemeniz için iade süreci bankanıza bağlı olarak 1-7 iş günü içinde kartınıza yansıyacaktır.\n\n`
        : "") +
      `Detaylar için hesabınızı inceleyebilirsiniz: https://www.pekefe.com/hesap`;

    WhatsAppNotificationService.sendTextMessage(String(customerPhone), waText).catch(() => {});
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
    loyaltyReversedPoints,
    invoicesCancelled,
    requiresPaymentRefund,
    error: !success ? (dbErrorMsg || "Sipariş veritabanında güncellenemedi.") : undefined,
  };
}
