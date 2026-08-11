import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePayTRCallback } from '@/lib/paytr';
import { emailNotificationService } from '@/lib/email-notification-service';
import { WhatsAppNotificationService } from '@/lib/whatsapp-service';

export async function POST(request: NextRequest) {
  try {
    const textData = await request.text();
    const params = new URLSearchParams(textData);
    const postData: Record<string, string> = {};

    params.forEach((value, key) => {
      postData[key] = value;
    });

    console.log('[PAYTR WEBHOOK NOTIFICATION RECEIVED]:', postData);

    const isValid = validatePayTRCallback(postData);
    if (!isValid) {
      console.error('[PAYTR WEBHOOK HASH MISMATCH]: Invalid Hash Signature!', postData);
      return new NextResponse('PAYTR notification failed: Bad Hash', { status: 400 });
    }

    const merchantOid = postData.merchant_oid;
    const status = postData.status; // 'success' or 'failed'
    const failedReason = postData.failed_reason_msg || 'Ödeme başarısız.';

    const order = await prisma.order.findUnique({
      where: { id: merchantOid },
      include: { currentAccount: true },
    });

    if (!order) {
      console.error(`[PAYTR WEBHOOK ERROR] Order not found: ${merchantOid}`);
      return new NextResponse('OK', { status: 200 });
    }

    if (status === 'success') {
      // Mark order as PAID / Yeni
      await prisma.order.update({
        where: { id: merchantOid },
        data: {
          status: 'Yeni',
          method: `PayTR Kredi Kartı (${postData.payment_type || '3D Secure'})`,
        },
      });

      // Create financial transaction in ERP
      if (order.currentAccountId) {
        await prisma.transaction.create({
          data: {
            currentAccountId: order.currentAccountId,
            type: 'Satış Faturası',
            amount: order.total,
            description: `${order.id} nolu sipariş PayTR 3D Secure ödemesi başarıyla alındı.`,
            paymentMethod: 'Kredi Kartı',
          },
        }).catch((e) => console.error('[PAYTR TRANSACTION ERROR]:', e));

        // Add Loyalty Points
        const earnedLoyaltyPoints = Math.floor(Number(order.total));
        if (earnedLoyaltyPoints > 0) {
          await prisma.currentAccount.update({
            where: { id: order.currentAccountId },
            data: {
              loyaltyPoints: { increment: earnedLoyaltyPoints },
            },
          }).catch((e) => console.error('[PAYTR LOYALTY ERROR]:', e));
        }
      }

      // Add Admin Notification raw SQL
      try {
        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const notifTitle = `${order.currentAccount?.name || 'Müşteri'} cari hesabından PayTR ödemeli yeni sipariş.`;
        const notifMsg = `${order.currentAccount?.name || 'Müşteri'} tarafından PayTR ile ₺${Number(order.total).toLocaleString('tr-TR')} tutarında ödeme yapıldı. Sipariş No: ${order.id}`;

        await prisma.$executeRawUnsafe(
          `INSERT INTO admin_notifications (id, title, message, type, isRead, createdAt, orderId) 
           VALUES (?, ?, ?, 'ORDER', 0, ?, ?)`,
          notifId,
          notifTitle,
          notifMsg,
          new Date().toISOString(),
          order.id
        );
      } catch (err) {
        console.error('[PAYTR ADMIN NOTIF ERROR]:', err);
      }

      // Send Email Notification
      if (order.currentAccount?.email) {
        try {
          await emailNotificationService.sendOrderConfirmation({
            id: order.id,
            customerName: order.currentAccount.name,
            customerEmail: order.currentAccount.email,
            totalAmount: Number(order.total),
            items: [{ name: order.summary || 'Sipariş İçeriği', quantity: 1, price: Number(order.total) }],
          });
        } catch (emailErr) {
          console.error('[PAYTR EMAIL SEND ERROR]:', emailErr);
        }
      }

      // Send WhatsApp Notification
      if (order.currentAccount?.phone) {
        try {
          await WhatsAppNotificationService.sendOrderNotification({
            orderId: order.id,
            customerName: order.currentAccount.name,
            customerPhone: order.currentAccount.phone,
            totalAmount: Number(order.total),
            itemCount: 1,
          });
        } catch (waErr) {
          console.error('[PAYTR WHATSAPP SEND ERROR]:', waErr);
        }
      }

      console.log(`[PAYTR SUCCESS] Order ${merchantOid} processed successfully.`);
      return new NextResponse('OK', { status: 200 });
    } else {
      // Mark order as FAILED / IPTAL
      await prisma.order.update({
        where: { id: merchantOid },
        data: {
          status: 'İptal / Başarısız',
        },
      });

      console.warn(`[PAYTR FAILED] Order ${merchantOid} payment failed: ${failedReason}`);
      return new NextResponse('OK', { status: 200 });
    }
  } catch (error: any) {
    console.error('[PAYTR WEBHOOK EXCEPTION]:', error);
    return new NextResponse('OK', { status: 200 });
  }
}

