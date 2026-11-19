import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { isAdminRole } from "@/lib/auth-helpers";
import { prisma, withTimeout } from "@/lib/prisma";
import { updateLocalOrderStatus } from "@/lib/jsonOrderDb";
import { emailNotificationService } from "@/lib/email-notification-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role || "";
    const authorized = isDev || (session?.user && (isAdminRole(role) || role === "DEALER"));

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const { orderIds, orderId, reason = "" } = body || {};
    const targetIds: string[] = Array.isArray(orderIds)
      ? orderIds.filter(Boolean)
      : orderId
      ? [String(orderId)]
      : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ success: false, error: "Sipariş ID belirtilmedi." }, { status: 400 });
    }

    const results: any[] = [];

    for (const rawId of targetIds) {
      let updatedOrder: any = null;
      const dashless = String(rawId).replace(/[^a-zA-Z0-9]/g, "");

      try {
        let existingOrder = await withTimeout(
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

        if (existingOrder) {
          const dbId = existingOrder.id;
          updatedOrder = await withTimeout(
            prisma.$transaction(async (tx) => {
              const order = await tx.order.update({
                where: { id: dbId },
                data: { status: "İptal Edildi" },
              });

              const normPrev = String(existingOrder!.status || "").toLowerCase();
              if (!normPrev.includes("iptal") && !normPrev.includes("iade")) {
                const reverseAmount = Number(existingOrder!.total || 0);
                if (existingOrder!.currentAccountId && reverseAmount > 0) {
                  await tx.transaction.create({
                    data: {
                      currentAccountId: existingOrder!.currentAccountId,
                      type: "IPTAL",
                      amount: -reverseAmount,
                      description: `Sipariş İptali: #${dbId}${reason ? ` (${reason})` : ""}`,
                      paymentMethod: existingOrder!.method || "Belirtilmedi",
                      date: new Date(),
                    },
                  });
                  await tx.currentAccount.update({
                    where: { id: existingOrder!.currentAccountId },
                    data: { balance: { decrement: reverseAmount } },
                  });
                }
              }

              return order;
            }),
            3500,
            null
          );

          // Fallback direct update if transaction timed out
          if (!updatedOrder) {
            updatedOrder = await withTimeout(
              prisma.order.update({
                where: { id: dbId },
                data: { status: "İptal Edildi" },
              }),
              2000,
              null
            );
          }
        }
      } catch (dbErr) {
        console.warn("[API ORDERS CANCEL DB WARN]:", dbErr);
      }

      // Always update local JSON DB using normalized ID matching
      const localUpdated = updateLocalOrderStatus(rawId, { status: "İptal Edildi" });

      const customerEmail = updatedOrder?.currentAccount?.email || localUpdated?.email;
      if (customerEmail && customerEmail !== "guest@nexab2b.com") {
        emailNotificationService
          .queueEmail(customerEmail, "order_status_updated", {
            kullanici_adi: updatedOrder?.currentAccount?.name || localUpdated?.client || "Değerli Müşterimiz",
            siparis_no: rawId,
            siparis_durumu: "İptal Edildi",
            siparis_tutari: Number(updatedOrder?.total || localUpdated?.amount || 0).toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            }),
            kargo_sirketi: "—",
            takip_no: "—",
            tarih: new Date().toLocaleDateString("tr-TR"),
            detay_linki: `${process.env.NEXTAUTH_URL || "https://pekefe.com"}/hesap`,
          })
          .catch(() => {});
      }

      results.push({ id: rawId, success: Boolean(updatedOrder || localUpdated) });
    }

    return NextResponse.json({
      success: true,
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
