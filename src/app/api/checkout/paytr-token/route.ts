import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPayTRToken } from '@/lib/paytr';
import { generateNextOrderId } from '@/lib/b2b-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { readLocalProducts } from '@/lib/jsonProductDb';
import fs from 'fs';
import path from 'path';

const PENDING_PAYTR_PATH = path.join(process.cwd(), 'data', 'paytr_pending_orders.json');

function savePendingPayTROrder(record: any) {
  try {
    const dir = path.dirname(PENDING_PAYTR_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let list: any[] = [];
    if (fs.existsSync(PENDING_PAYTR_PATH)) {
      try {
        list = JSON.parse(fs.readFileSync(PENDING_PAYTR_PATH, 'utf-8'));
        if (!Array.isArray(list)) list = [];
      } catch {
        list = [];
      }
    }
    list = list.filter((x) => x.merchantOid !== record.merchantOid && x.orderId !== record.orderId);
    list.unshift(record);
    // Keep last 200 pending attempts
    if (list.length > 200) list = list.slice(0, 200);
    fs.writeFileSync(PENDING_PAYTR_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[PAYTR PENDING SAVE WARN]:', e);
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'apiLimit');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const {
      cart,
      cartTotal,
      name,
      phone,
      email,
      address,
      city,
      district,
      shippingFee = 0,
      selectedCarrierName = 'Kargo',
      clientIp = '',
    } = body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Sepetinizde ürün bulunmuyor.' }, { status: 400 });
    }

    if (!name || !phone || !address || !city) {
      return NextResponse.json({ error: 'Lütfen teslimat adresi bilgilerini eksiksiz doldurunuz.' }, { status: 400 });
    }

    // 🛡️ SERVER-SIDE REAL-TIME STOCK VALIDATION LAYER
    try {
      const dbProducts = readLocalProducts();
      for (const item of cart) {
        const targetIdStr = String(item.id || item.productId);
        const rawProductId = targetIdStr.split('_')[0];
        const dbProduct = dbProducts.find(p => String(p.id) === targetIdStr || String(p.id) === rawProductId || p.sku === targetIdStr);
        
        if (dbProduct) {
          const availableStock = Number(dbProduct.stock ?? dbProduct.stock_quantity ?? 0);
          const requestedQty = Number(item.quantity || 1);
          
          if (requestedQty > availableStock) {
            console.warn(`[STOCK REJECTION] Product "${dbProduct.name}" requested: ${requestedQty}, Available: ${availableStock}`);
            return NextResponse.json({
              error: `Stok Yetersiz: "${dbProduct.name}" ürünü için stokta sadece ${availableStock} adet bulunmaktadır. Lütfen sepetinizdeki adedi düşürün.`
            }, { status: 400 });
          }
        }
      }
    } catch (stockErr) {
      console.error("[STOCK CHECK WARNING] Live stock check error:", stockErr);
    }

    // Extract customer IP robustly across proxies, Cloudflare, cPanel Apache and frontend detection
    const cfIp = request.headers.get('cf-connecting-ip');
    const realIp = request.headers.get('x-real-ip');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIpHeader = request.headers.get('x-client-ip');
    
    let userIp = (clientIp || '').trim() || cfIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || clientIpHeader || '88.255.12.34';
    if (userIp.includes('::ffff:')) {
      userIp = userIp.replace('::ffff:', '');
    }
    if (!userIp || userIp === '::1' || userIp === '127.0.0.1' || userIp.startsWith('10.') || userIp.startsWith('192.168.')) {
      userIp = (clientIp || '').trim() || '88.255.12.34';
    }

    // Generate Unique Order ID (e.g. PKF-2026-000001 -> PKF2026000001)
    const rawOrderId = await generateNextOrderId("B2C");
    const customOrderId = rawOrderId.replace(/[^a-zA-Z0-9]/g, '');
    const grandTotal = Number(cartTotal);
    const customerEmail = email || `${phone.replace(/\D/g, '')}@pekefe.com`;

    // PayTR 3D Secure Akışı: Sipariş kaydı ve stok düşümü YALNIZCA PayTR ödeme onayı (Webhook success) geldikten sonra yapılır.
    const fullAddress = `${address}${district ? `, ${district}` : ''} / ${city}`;

    // PayTR Basket Format
    const paytrBasket = cart.map((item: any) => ({
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    if (Number(shippingFee) > 0) {
      paytrBasket.push({
        name: `Kargo Ücreti (${selectedCarrierName || 'Kargo'})`,
        price: Number(shippingFee),
        quantity: 1,
      });
    }

    // PayTR requires unique merchant_oid per attempt so previously used IDs never invalidate
    const paytrMerchantOid = `${customOrderId}T${Date.now()}`;

    const isLocalhost = request.headers.get('host')?.includes('localhost');
    const targetOkUrl = isLocalhost 
      ? `http://${request.headers.get('host')}/sepet/onay?oid=${encodeURIComponent(paytrMerchantOid)}&orderId=${encodeURIComponent(customOrderId)}` 
      : `https://www.pekefe.com/sepet/onay?oid=${encodeURIComponent(paytrMerchantOid)}&orderId=${encodeURIComponent(customOrderId)}`;
    
    const targetFailUrl = isLocalhost 
      ? `http://${request.headers.get('host')}/sepet/odeme?error=paytr` 
      : 'https://www.pekefe.com/sepet/odeme?error=paytr';

    const cleanPhone = (phone || '05000000000').replace(/\D/g, '');
    const cleanUserName = (name || 'Pekefe Müşterisi').trim();
    const cleanUserAddress = (fullAddress || 'Türkiye').trim();

    // ====== PAYTR DIAGNOSTIC LOGGING ======
    const basketSum = paytrBasket.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const basketSumKurus = Math.round(basketSum * 100);
    const grandTotalKurus = Math.round(grandTotal * 100);
    
    console.log('===== [PAYTR DIAGNOSTIC] =====');
    console.log('clientIp from browser:', clientIp);
    console.log('cfIp:', cfIp, '| realIp:', realIp, '| forwardedFor:', forwardedFor, '| clientIpHeader:', clientIpHeader);
    console.log('FINAL userIp sent to PayTR:', userIp);
    console.log('merchantOid:', paytrMerchantOid);
    console.log('email:', customerEmail);
    console.log('grandTotal (TL):', grandTotal, '| grandTotalKurus:', grandTotalKurus);
    console.log('basketSum (TL):', basketSum, '| basketSumKurus:', basketSumKurus);
    console.log('MATCH?:', grandTotalKurus === basketSumKurus ? '✅ YES' : '❌ NO - MISMATCH!');
    console.log('basket items:', JSON.stringify(paytrBasket));
    console.log('shippingFee:', shippingFee);
    console.log('okUrl:', targetOkUrl);
    console.log('failUrl:', targetFailUrl);
    console.log('host header:', request.headers.get('host'));
    console.log('==============================');

    // FIX: Force payment_amount to match basket sum exactly
    const correctedPaymentAmount = basketSum;

    // Create PayTR Token
    const paytrResult = await createPayTRToken({
      merchantOid: paytrMerchantOid,
      email: customerEmail,
      paymentAmount: correctedPaymentAmount,
      userName: cleanUserName,
      userAddress: cleanUserAddress,
      userPhone: cleanPhone,
      userIp: userIp,
      basket: paytrBasket,
      okUrl: targetOkUrl,
      failUrl: targetFailUrl,
    });

    console.log('[PAYTR TOKEN RESULT]:', JSON.stringify(paytrResult));

    if (!paytrResult.success || !paytrResult.token) {
      return NextResponse.json(
        { error: paytrResult.error || 'PayTR ödeme jetonu üretilemedi.' },
        { status: 500 }
      );
    }

    const orderSummary =
      `${selectedCarrierName ? `[${selectedCarrierName}] ` : ''}` +
      cart.map((item: any) => `${item.name} (${item.quantity})`).join(', ');

    savePendingPayTROrder({
      merchantOid: paytrMerchantOid,
      orderId: customOrderId,
      name: cleanUserName,
      email: customerEmail,
      phone: cleanPhone,
      address: cleanUserAddress,
      city,
      district: district || '',
      total: correctedPaymentAmount,
      shippingFee: Number(shippingFee),
      cargoCompany: selectedCarrierName || 'Kargo',
      summary: orderSummary,
      items: cart,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      token: paytrResult.token,
      orderId: customOrderId,
      merchantOid: paytrMerchantOid,
    });
  } catch (error: any) {
    console.error('[PAYTR TOKEN ROUTE ERROR]:', error);
    const friendlyMsg = (error?.message && (error.message.includes('prisma') || error.message.includes('database') || error.message.includes('Authentication failed')))
      ? 'Ödeme altyapısı güncellenmektedir. Lütfen alternatif ödeme yöntemini deneyiniz.'
      : (error?.message || 'Ödeme oturumu başlatılırken bir sunucu hatası oluştu.');
    return NextResponse.json(
      { error: friendlyMsg },
      { status: 500 }
    );
  }
}

