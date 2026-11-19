import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { isAdminRole } from "@/lib/auth-helpers";
import { prisma, withTimeout } from "@/lib/prisma";
import { readLocalOrders, updateLocalOrderStatus } from "@/lib/jsonOrderDb";
import { emailNotificationService } from "@/lib/email-notification-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === "development";
    const role = (session?.user as any)?.role || "";
    const authorized = isDev || (session?.user && isAdminRole(role));

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      nextStatus = "Ödeme Onaylandı",
      bankId = "",
      note = "",
    } = body || {};

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Sipariş ID zorunludur." }, { status: 400 });
    }

    const rawId = String(orderId);
    const dashless = rawId.replace(/[^a-zA-Z0-9]/g, "");
    const operatorName = session?.user?.name || session?.user?.email || "Yönetici";

    let updatedOrder: any = null;
    let collectionRecorded = false;

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
        const orderTotal = Number(existingOrder.total || 0);

        updatedOrder = await withTimeout(
          prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
              where: { id: dbId },
              data: { status: nextStatus },
              include: { currentAccount: true },
            });

            // Prevent duplicate TAHSILAT transaction for the same order
            const existingTx = await tx.transaction.findFirst({
              where: {
                type: "TAHSILAT",
                description: { contains: dbId },
              },
            });

            if (!existingTx && orderTotal > 0 && existingOrder!.currentAccountId) {
              await tx.transaction.create({
                data: {
                  currentAccountId: existingOrder!.currentAccountId,
                  type: "TAHSILAT",
                  amount: orderTotal,
                  description: `Banka Havalesi Tahsilatı (#${dbId})${note ? ` - ${note}` : ""} [Onay: ${operatorName}]`,
                  paymentMethod: "Banka Havalesi / EFT",
                  date: new Date(),
                },
              });

              await tx.currentAccount.update({
                where: { id: existingOrder!.currentAccountId },
                data: { balance: { decrement: orderTotal } },
              });

              collectionRecorded = true;
            }

            if (bankId && !existingTx && orderTotal > 0) {
              await tx.bank
                .update({
                  where: { id: bankId },
                  data: { balance: { increment: orderTotal } },
                })
                .catch(() => null);
            }

            await tx.invoice
              .updateMany({
                where: { orderId: dbId, isDeleted: false },
                data: { status: "ODENDI" },
              })
              .catch(() => null);

            return order;
          }),
          4000,
          null
        );

        if (!updatedOrder) {
          updatedOrder = await withTimeout(
            prisma.order.update({
              where: { id: dbId },
              data: { status: nextStatus },
              include: { currentAccount: true },
            }),
            2000,
            null
          );
        }
      }
    } catch (dbErr) {
      console.warn("[API CONFIRM PAYMENT DB WARN]:", dbErr);
    }

    // Update local JSON order store
    const localOrders = readLocalOrders();
    const normTarget = dashless.toUpperCase();
    const matchedLocal = localOrders.find(
      (o) =>
        o.id === rawId ||
        o.orderNumber === rawId ||
        String(o.id || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === normTarget
    );

    const localUpdated = updateLocalOrderStatus(rawId, {
      status: nextStatus,
      method: matchedLocal?.method?.includes("Onaylandı")
        ? matchedLocal.method
        : `${matchedLocal?.method || "Banka Havalesi"} (Ödeme Onaylandı)`,
    });

    const customerEmail = updatedOrder?.currentAccount?.email || localUpdated?.email;
    if (customerEmail && customerEmail !== "guest@nexab2b.com") {
      emailNotificationService
        .queueEmail(customerEmail, "order_status_updated", {
          kullanici_adi: updatedOrder?.currentAccount?.name || localUpdated?.client || "Değerli Müşterimiz",
          siparis_no: rawId,
          siparis_durumu: nextStatus,
          siparis_tutari: Number(updatedOrder?.total || localUpdated?.amount || 0).toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
          }),
          kargo_sirketi: localUpdated?.cargoCompany || "—",
          takip_no: localUpdated?.trackingNo || "—",
          tarih: new Date().toLocaleDateString("tr-TR"),
          detay_linki: `${process.env.NEXTAUTH_URL || "https://pekefe.com"}/hesap`,
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      collectionRecorded,
      order: updatedOrder || localUpdated,
    });
  } catch (error: any) {
    console.error("[API CONFIRM PAYMENT ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Ödeme onayı ve tahsilat işlenemedi." },
      { status: 500 }
    );
  }
}
