import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { isAdminRole } from "@/lib/auth-helpers";
import { cancelOrderWithSideEffects } from "@/lib/orderCancellation";
import { prisma, withTimeout } from "@/lib/prisma";
import { readLocalOrders } from "@/lib/jsonOrderDb";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role || "";
    const authorized = isDev || (session?.user && (isAdminRole(role) || role.toUpperCase() === "DEALER"));

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const { orderItems, orderIds, orderId, orderNumber, reason = "" } = body || {};

    const targets: Array<{ id: string; orderNumber?: string }> = [];
    if (Array.isArray(orderItems) && orderItems.length > 0) {
      for (const item of orderItems) {
        if (item?.id) targets.push({ id: String(item.id), orderNumber: item.orderNumber ? String(item.orderNumber) : undefined });
      }
    } else if (Array.isArray(orderIds) && orderIds.length > 0) {
      for (const id of orderIds) {
        if (id) targets.push({ id: String(id) });
      }
    } else if (orderId) {
      targets.push({ id: String(orderId), orderNumber: orderNumber ? String(orderNumber) : undefined });
    }

    if (targets.length === 0) {
      return NextResponse.json({ success: false, error: "Sipariş ID belirtilmedi." }, { status: 400 });
    }

    const isAdmin = isDev || Boolean(session?.user && isAdminRole(role));
    const callerEmail = String(session?.user?.email || "").toLowerCase().trim();
    const localOrders = isAdmin ? [] : readLocalOrders();

    const results = [];
    for (const target of targets) {
      // Bayi (DEALER) veya normal kullanıcı kendi siparişi dışındaki siparişleri iptal edemez
      // ve kargoya verilmiş/teslim edilmiş siparişi doğrudan iptal edemez (iade akışı gerekir).
      if (!isAdmin) {
        const dbOrd = await withTimeout(
          prisma.order.findUnique({
            where: { id: target.id },
            include: { currentAccount: { select: { email: true } } },
          }),
          3000,
          null
        );
        const locOrd = localOrders.find(
          (o) => String(o.id) === target.id || String(o.orderNumber || "") === target.id
        );
        const ownerEmail = String(dbOrd?.currentAccount?.email || locOrd?.email || "").toLowerCase().trim();
        const currentStatus = String(dbOrd?.status || locOrd?.status || "");

        if (!ownerEmail || ownerEmail !== callerEmail) {
          results.push({
            id: target.id,
            dbId: dbOrd?.id || null,
            success: false,
            dbUpdated: false,
            localUpdated: false,
            alreadyCancelled: false,
            stockRestoredCount: 0,
            ledgerReversed: false,
            loyaltyReversedPoints: 0,
            invoicesCancelled: 0,
            requiresPaymentRefund: false,
            error: "Bu siparişi iptal etme yetkiniz bulunmamaktadır.",
          });
          continue;
        }

        if (/kargo|teslim|tamamland/i.test(currentStatus)) {
          results.push({
            id: target.id,
            dbId: dbOrd?.id || null,
            success: false,
            dbUpdated: false,
            localUpdated: false,
            alreadyCancelled: false,
            stockRestoredCount: 0,
            ledgerReversed: false,
            loyaltyReversedPoints: 0,
            invoicesCancelled: 0,
            requiresPaymentRefund: false,
            error: "Kargoya verilmiş veya teslim edilmiş siparişler doğrudan iptal edilemez; iade talebi oluşturmalısınız.",
          });
          continue;
        }
      }

      const res = await cancelOrderWithSideEffects({
        rawId: target.id,
        orderNumber: target.orderNumber,
        targetStatus: "İptal Edildi",
        reason: String(reason || ""),
        userId: (session?.user as any)?.id || null,
        userEmail: session?.user?.email || null,
      });
      results.push(res);
    }

    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (succeeded.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: failed[0]?.error || "Belirtilen sipariş bulunamadı veya iptal edilemedi.",
          succeededCount: 0,
          failedCount: failed.length,
          failed,
          results,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: failed.length === 0,
      partial: failed.length > 0,
      succeededCount: succeeded.length,
      failedCount: failed.length,
      failed,
      results,
    });
  } catch (error: any) {
    console.error("[API ORDERS CANCEL ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Sipariş iptal edilemedi." },
      { status: 500 }
    );
  }
}
