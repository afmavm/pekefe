import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePayTRCallback, getPayTRCredentials } from '@/lib/paytr';
import { emailNotificationService } from '@/lib/email-notification-service';
import { WhatsAppNotificationService } from '@/lib/whatsapp-service';

export async function GET() {
  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const textData = await request.text();
    const params = new URLSearchParams(textData);
    const postData: Record<string, string> = {};

    params.forEach((value, key) => {
      postData[key] = value;
    });

    console.log('[PAYTR WEBHOOK NOTIFICATION RECEIVED]:', postData);

    // 1. PayTR Test ping / Canlıya geçiş kontrolü (Parametre boş veya test amaçlı ise)
    if (!postData.merchant_oid || !postData.hash) {
      console.log('[PAYTR PING / HEALTH CHECK RECEIVED] Responding OK.');
      return new NextResponse('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 2. Hash Doğrulaması
    const isValid = validatePayTRCallback(postData);
    if (!isValid) {
      console.error('[PAYTR WEBHOOK HASH MISMATCH]: Invalid Hash Signature!', postData);
      return new NextResponse('PAYTR notification failed: Bad Hash', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const merchantOid = postData.merchant_oid;
    const status = postData.status; // 'success' or 'failed'
    const failedReason = postData.failed_reason_msg || 'Ödeme başarısız.';

    let order: any = null;
    try {
      order = await prisma.order.findUnique({
        where: { id: merchantOid },
        include: { currentAccount: true },
      });
    } catch (e) {
      console.warn('[PAYTR WEBHOOK DB WARN] Prisma error:', e);
    }

    if (!order) {
      console.log(`[PAYTR WEBHOOK] Test or local order processed: ${merchantOid}`);
      return new NextResponse('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (status === 'success') {
      // Mark order as PAID / Yeni
      try {
        await prisma.order.update({
          where: { id: merchantOid },
          data: {
            status: 'Yeni',
            method: `PayTR Kredi Kartı (${postData.payment_type || '3D Secure'})`,
          },
        });
      } catch (e) {}

      // Create financial transaction in ERP
      if (order.currentAccountId) {
        try {
          await prisma.transaction.create({
            data: {
              currentAccountId: order.currentAccountId,
              type: 'Satış Faturası',
              amount: order.total,
              description: `${order.id} nolu sipariş PayTR 3D Secure ödemesi başarıyla alındı.`,
              paymentMethod: 'Kredi Kartı',
            },
          });
        } catch (e) {}

        // Add Loyalty Points
        const earnedLoyaltyPoints = Math.floor(Number(order.total));
        if (earnedLoyaltyPoints > 0) {
          try {
            await prisma.currentAccount.update({
              where: { id: order.currentAccountId },
              data: {
                loyaltyPoints: { increment: earnedLoyaltyPoints },
              },
            });
          } catch (e) {}
        }
      }

      // Add Admin Notification
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
      } catch (err) {}

      // Send Email Notification
      if (order.currentAccount?.email) {
        try {
          const orderDateStr = new Date().toLocaleDateString("tr-TR", {
            day: "2-digit", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          });
          await emailNotificationService.queueEmail(order.currentAccount.email, "order_received", {
            kullanici_adi: order.currentAccount.name,
            siparis_no: order.id,
            siparis_tutari: Number(order.total).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            siparis_icerik: order.summary || 'Sipariş Ürünleri',
            odeme_yontemi: 'PayTR 3D Secure Kredi Kartı',
            kargo_adresi: order.currentAccount.address || 'Teslimat Adresi',
            kargo_sirketi: 'Kargo',
            tarih: orderDateStr,
            detay_linki: 'https://www.pekefe.com/hesap'
          });
        } catch (emailErr) {}
      }

      // Send WhatsApp Notification
      if (order.currentAccount?.phone) {
        try {
          const msg = `Sayın ${order.currentAccount.name}, #${order.id} nolu Pekefe siparişinizin PayTR ödemesi (₺${Number(order.total).toLocaleString('tr-TR')}) başarıyla alındı. Teşekkür ederiz!`;
          await WhatsAppNotificationService.sendWhatsApp(order.currentAccount.phone, msg);
        } catch (waErr) {}
      }

      console.log(`[PAYTR SUCCESS] Order ${merchantOid} processed successfully.`);
      return new NextResponse('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } else {
      // Mark order as FAILED
      try {
        await prisma.order.update({
          where: { id: merchantOid },
          data: {
            status: 'İptal / Başarısız',
          },
        });
      } catch (e) {}

      console.warn(`[PAYTR FAILED] Order ${merchantOid} payment failed: ${failedReason}`);
      return new NextResponse('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  } catch (error: any) {
    console.error('[PAYTR WEBHOOK EXCEPTION]:', error);
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

