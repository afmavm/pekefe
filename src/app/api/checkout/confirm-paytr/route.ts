import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { readLocalOrders, saveLocalOrder } from '@/lib/jsonOrderDb';
import { deductLocalProductStock } from '@/lib/jsonProductDb';
import { emailNotificationService } from '@/lib/email-notification-service';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PENDING_PAYTR_PATH = path.join(process.cwd(), 'data', 'paytr_pending_orders.json');

function getPendingOrder(oid: string, orderId: string) {
  try {
    if (!fs.existsSync(PENDING_PAYTR_PATH)) return null;
    const list = JSON.parse(fs.readFileSync(PENDING_PAYTR_PATH, 'utf-8'));
    if (!Array.isArray(list)) return null;
    return (
      list.find(
        (x: any) =>
          (oid && (x.merchantOid === oid || x.orderId === oid)) ||
          (orderId && (x.orderId === orderId || x.merchantOid === orderId))
      ) || null
    );
  } catch {
    return null;
  }
}

function normalizeId(val?: string) {
  return String(val || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oid = '', orderId = '', completedOrder = null } = body || {};

    const baseFromOid = oid && oid.includes('T') ? oid.split('T')[0] : oid;
    const pending = getPendingOrder(oid, orderId || baseFromOid);

    const finalOrderId =
      pending?.orderId ||
      orderId ||
      baseFromOid ||
      completedOrder?.orderId ||
      oid;

    if (!finalOrderId) {
      return NextResponse.json({ success: false, error: 'Sipariş numarası bulunamadı.' }, { status: 400 });
    }

    const normTarget = normalizeId(finalOrderId);
    const localOrders = readLocalOrders();
    const alreadyExistsLocal = localOrders.some(
      (o) => normalizeId(o.id) === normTarget || normalizeId(o.orderNumber) === normTarget
    );

    if (alreadyExistsLocal) {
      return NextResponse.json({ success: true, orderId: finalOrderId, status: 'already_recorded' });
    }

    const addrObj = completedOrder?.shippingAddress || {};
    const customerName =
      pending?.name ||
      addrObj.name ||
      `${addrObj.firstName || ''} ${addrObj.lastName || ''}`.trim() ||
      'PayTR Müşterisi';
    const customerEmail = pending?.email || completedOrder?.email || 'info@pekefe.com';
    const customerPhone = pending?.phone || addrObj.phone || '';
    const customerAddress =
      pending?.address ||
      `${addrObj.fullAddress || addrObj.address || ''}${addrObj.district ? `, ${addrObj.district}` : ''}${addrObj.city ? ` / ${addrObj.city}` : ''}`.trim() ||
      'Türkiye';
    const items = Array.isArray(pending?.items) && pending.items.length > 0
      ? pending.items
      : Array.isArray(completedOrder?.items)
      ? completedOrder.items
      : [];
    const orderTotal = Number(pending?.total ?? completedOrder?.total ?? 1);
    const shippingFee = Number(pending?.shippingFee ?? completedOrder?.shippingCost ?? 0);
    const cargoCompany = pending?.cargoCompany || completedOrder?.cargoCompany || 'Kargo';
    const orderSummary =
      pending?.summary ||
      `${cargoCompany ? `[${cargoCompany}] ` : ''}` +
        (items.length > 0
          ? items.map((it: any) => `${it.name} (${it.quantity || 1})`).join(', ')
          : `PayTR 3D Secure Siparişi`);

    // 1. Yerel JSON sipariş veritabanına kaydet
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
      shippingFee,
      type: 'B2C',
      method: 'PayTR Kredi Kartı (3D Secure)',
      summary: orderSummary,
      cargoCompany,
      items,
    });

    if (items.length > 0) {
      items.forEach((it: any) => {
        try {
          deductLocalProductStock(it.id || it.productId || it, Number(it.quantity || 1));
        } catch {}
      });
    }

    // 2. Prisma MySQL veritabanına kaydet (zaman aşımlı)
    try {
      const existingDb = await withTimeout(
        prisma.order.findFirst({
          where: { OR: [{ id: finalOrderId }, { id: oid }] },
        }),
        2000,
        null
      );

      if (!existingDb) {
        let account: any = await withTimeout(
          prisma.currentAccount.findFirst({ where: { email: customerEmail } }),
          1500,
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
            1500,
            null
          );
        }
        if (account?.id) {
          const resolvedOrderType =
            account.type === 'BAYI' || account.cariTipi === 'CORPORATE' ? 'B2B' : 'B2C';
          await withTimeout(
            prisma.order.create({
              data: {
                id: finalOrderId,
                currentAccountId: account.id,
                date: new Date(),
                total: orderTotal,
                shippingFee,
                status: 'Yeni',
                summary: orderSummary,
                type: resolvedOrderType,
                method: 'PayTR Kredi Kartı (3D Secure)',
              },
            }),
            2000,
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
    } catch {}

    // 3. Bildirim e-postasını arka planda tetikle
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
          kargo_sirketi: cargoCompany,
          tarih: orderDateStr,
          detay_linki: 'https://www.pekefe.com/hesap',
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, orderId: finalOrderId, status: 'recorded' });
  } catch (err: any) {
    console.error('[CONFIRM PAYTR ERROR]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Hata' }, { status: 500 });
  }
}
