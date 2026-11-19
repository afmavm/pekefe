import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { validatePayTRCallback } from '@/lib/paytr';
import { emailNotificationService } from '@/lib/email-notification-service';
import { WhatsAppNotificationService } from '@/lib/whatsapp-service';
import { readLocalOrders, saveLocalOrder, updateLocalOrderStatus } from '@/lib/jsonOrderDb';
import { deductLocalProductStock } from '@/lib/jsonProductDb';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PENDING_PAYTR_PATH = path.join(process.cwd(), 'data', 'paytr_pending_orders.json');

function getPendingPayTROrder(merchantOid: string, baseOrderId: string) {
  try {
    if (!fs.existsSync(PENDING_PAYTR_PATH)) return null;
    const list = JSON.parse(fs.readFileSync(PENDING_PAYTR_PATH, 'utf-8'));
    if (!Array.isArray(list)) return null;
    return (
      list.find(
        (x: any) =>
          x.merchantOid === merchantOid ||
          x.orderId === baseOrderId ||
          x.orderId === merchantOid
      ) || null
    );
  } catch {
    return null;
  }
}

function okResponse() {
  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function GET() {
  return okResponse();
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const postData: Record<string, string> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        postData[key] = String(value);
      });
    } else {
      const textData = await request.text();
      if (textData.trim().startsWith('{')) {
        try {
          const json = JSON.parse(textData);
          Object.keys(json).forEach((k) => {
            postData[k] = String(json[k]);
          });
        } catch {}
      } else {
        const params = new URLSearchParams(textData);
        params.forEach((value, key) => {
          postData[key] = value;
        });
      }
    }

    console.log('[PAYTR WEBHOOK NOTIFICATION RECEIVED]:', postData);

    // 1. PayTR Test ping / Canlıya geçiş kontrolü
    if (!postData.merchant_oid || !postData.hash) {
      return okResponse();
    }

    // 2. Hash Doğrulaması
    const isValid = validatePayTRCallback(postData);
    if (!isValid) {
      console.warn('[PAYTR WEBHOOK HASH MISMATCH] Responding OK 200:', postData);
      return okResponse();
    }

    const merchantOid = postData.merchant_oid || '';
    const baseOrderId = merchantOid.includes('T') ? merchantOid.split('T')[0] : merchantOid;
    const status = postData.status; // 'success' or 'failed'
    const paidTotalTl = Number(postData.total_amount || 0) / 100;

    // 3. Siparişi veritabanında veya bekleyen siparişlerde bul
    let order: any = await withTimeout(
      prisma.order.findFirst({
        where: {
          OR: [{ id: merchantOid }, { id: baseOrderId }],
        },
        include: { currentAccount: true },
      }),
      2500,
      null
    );

    const pendingOrder = getPendingPayTROrder(merchantOid, baseOrderId);

    if (status === 'success') {
      const finalOrderId = order?.id || pendingOrder?.orderId || baseOrderId || merchantOid;
      const customerName = order?.currentAccount?.name || pendingOrder?.name || 'PayTR Müşterisi';
      const customerEmail = order?.currentAccount?.email || pendingOrder?.email || 'info@pekefe.com';
      const customerPhone = order?.currentAccount?.phone || pendingOrder?.phone || '';
      const customerAddress = order?.currentAccount?.address || pendingOrder?.address || 'Türkiye';
      const orderTotal = Number(order?.total || pendingOrder?.total || paidTotalTl || 1);
      const orderSummary =
        order?.summary ||
        pendingOrder?.summary ||
        `PayTR 3D Secure Ödemeli Sipariş (${orderTotal.toLocaleString('tr-TR')} TL)`;

      // Yerel JSON sipariş veritabanına kaydet / güncelle
      try {
        const localOrders = readLocalOrders();
        const existingLocal = localOrders.find(
          (o) => o.id === finalOrderId || o.id === merchantOid || o.id === baseOrderId
        );
        if (existingLocal) {
          updateLocalOrderStatus(existingLocal.id, {
            status: 'Yeni',
            method: `PayTR Kredi Kartı (${postData.payment_type || '3D Secure'})`,
          });
        } else {
          saveLocalOrder({
            id: finalOrderId,
            orderNumber: finalOrderId,
            client: customerName,
            customerName,
            email: customerEmail,
            phone: customerPhone,
            address: customerAddress,
            date: new Date().toISOString(),
            status: 'Yeni',
            amount: orderTotal,
            total: orderTotal,
            shippingFee: Number(pendingOrder?.shippingFee || 0),
            type: 'B2C',
            method: `PayTR Kredi Kartı (${postData.payment_type || '3D Secure'})`,
            summary: orderSummary,
            cargoCompany: pendingOrder?.cargoCompany || 'Kargo',
            items: Array.isArray(pendingOrder?.items) ? pendingOrder.items : [],
          });

          if (Array.isArray(pendingOrder?.items)) {
            pendingOrder.items.forEach((item: any) => {
              deductLocalProductStock(item.id || item.productId, item.quantity || 1);
            });
          }
        }
      } catch (localErr) {
        console.warn('[PAYTR LOCAL ORDER SAVE WARN]:', localErr);
      }

      // Prisma MySQL veritabanına kaydet / güncelle (zaman aşımlı, bloklamayan)
      try {
        if (order) {
          await withTimeout(
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'Yeni',
                method: `PayTR Kredi Kartı (${postData.payment_type || '3D Secure'})`,
              },
            }),
            2500,
            null
          );
        } else {
          let account: any = await withTimeout(
            prisma.currentAccount.findFirst({
              where: { email: customerEmail },
            }),
            2000,
            null
          );

          if (!account) {
            account = await withTimeout(
              prisma.currentAccount.create({
                data: {
                  name: customerName,
                  email: customerEmail,
                  phone: customerPhone,
                  address: customerAddress,
                  type: 'B2C',
                  cariTipi: 'INDIVIDUAL',
                },
              }),
              2000,
              null
            );
          }

          if (account?.id) {
            const resolvedOrderType =
              account.type === 'BAYI' || account.cariTipi === 'CORPORATE' ? 'B2B' : 'B2C';
            order = await withTimeout(
              prisma.order.create({
                data: {
                  id: finalOrderId,
                  currentAccountId: account.id,
                  date: new Date(),
                  total: orderTotal,
                  shippingFee: Number(pendingOrder?.shippingFee || 0),
                  status: 'Yeni',
                  summary: orderSummary,
                  type: resolvedOrderType,
                  method: `PayTR Kredi Kartı (${postData.payment_type || '3D Secure'})`,
                },
              }),
              2500,
              null
            );

            // Kredi kartı tahsilatını cari hareketine otomatik işle (mükerrer korumalı)
            if (orderTotal > 0) {
              const existingTx = await withTimeout(
                prisma.transaction.findFirst({
                  where: {
                    currentAccountId: account.id,
                    type: 'TAHSILAT',
                    description: { contains: finalOrderId },
                  },
                }),
                1500,
                null
              );
              if (!existingTx) {
                await withTimeout(
                  prisma.transaction.create({
                    data: {
                      currentAccountId: account.id,
                      type: 'TAHSILAT',
                      amount: orderTotal,
                      description: `PayTR Kredi Kartı Tahsilatı (#${finalOrderId})`,
                      paymentMethod: 'PayTR Kredi Kartı',
                      date: new Date(),
                    },
                  }),
                  1500,
                  null
                );
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn('[PAYTR PRISMA SYNC WARN]:', dbErr);
      }

      // E-posta ve WhatsApp bildirimlerini arka planda (non-blocking) tetikle
      if (customerEmail) {
        const orderDateStr = new Date().toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        emailNotificationService
          .queueEmail(customerEmail, 'order_received', {
            kullanici_adi: customerName,
            siparis_no: finalOrderId,
            siparis_tutari: orderTotal.toLocaleString('tr-TR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            siparis_icerik: orderSummary,
            odeme_yontemi: 'PayTR 3D Secure Kredi Kartı',
            kargo_adresi: customerAddress,
            kargo_sirketi: pendingOrder?.cargoCompany || 'Kargo',
            tarih: orderDateStr,
            detay_linki: 'https://www.pekefe.com/hesap',
          })
          .catch(() => {});
      }

      if (customerPhone) {
        const msg = `Sayın ${customerName}, #${finalOrderId} nolu Pekefe siparişinizin PayTR ödemesi (₺${orderTotal.toLocaleString('tr-TR')}) başarıyla alındı. Teşekkür ederiz!`;
        WhatsAppNotificationService.sendWhatsApp(customerPhone, msg).catch(() => {});
      }

      console.log(`[PAYTR SUCCESS] Order ${finalOrderId} (${merchantOid}) confirmed.`);
      return okResponse();
    } else {
      // Başarısız ödeme bildirimi
      if (order?.id) {
        await withTimeout(
          prisma.order.update({
            where: { id: order.id },
            data: { status: 'İptal / Başarısız' },
          }),
          2000,
          null
        );
      }
      return okResponse();
    }
  } catch (error: any) {
    console.error('[PAYTR WEBHOOK EXCEPTION]:', error);
    return okResponse();
  }
}
