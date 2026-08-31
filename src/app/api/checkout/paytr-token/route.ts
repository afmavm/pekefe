import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPayTRToken } from '@/lib/paytr';
import { generateNextOrderId } from '@/lib/b2b-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { saveLocalOrder } from '@/lib/jsonOrderDb';
import { readLocalProducts, deductLocalProductStock } from '@/lib/jsonProductDb';
import { emailNotificationService } from '@/lib/email-notification-service';

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

    // Extract customer IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Generate Unique Order ID (e.g. PKF-2026-0001 -> PKF20260001)
    const rawOrderId = await generateNextOrderId();
    const customOrderId = rawOrderId.replace(/[^a-zA-Z0-9]/g, '');
    const grandTotal = Number(cartTotal);
    const customerEmail = email || `${phone.replace(/\D/g, '')}@pekefe.com`;

    // PayTR 3D Secure Akışı: Sipariş kaydı ve stok düşümü YALNIZCA PayTR ödeme onayı (Webhook success) geldikten sonra yapılır.
    // Burada erken sipariş veya bildirim tetiklenmez.

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

    const isLocalhost = request.headers.get('host')?.includes('localhost');
    const targetOkUrl = isLocalhost 
      ? `http://${request.headers.get('host')}/sepet/onay` 
      : 'https://www.pekefe.com/sepet/onay';
    
    const targetFailUrl = isLocalhost 
      ? `http://${request.headers.get('host')}/sepet/odeme?error=paytr` 
      : 'https://www.pekefe.com/sepet/odeme?error=paytr';

    // Create PayTR Token
    const paytrResult = await createPayTRToken({
      merchantOid: customOrderId,
      email: customerEmail,
      paymentAmount: grandTotal,
      userName: name,
      userAddress: fullAddress,
      userPhone: phone,
      userIp: userIp,
      basket: paytrBasket,
      okUrl: targetOkUrl,
      failUrl: targetFailUrl,
    });

    if (!paytrResult.success || !paytrResult.token) {
      return NextResponse.json(
        { error: paytrResult.error || 'PayTR ödeme jetonu üretilemedi.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: paytrResult.token,
      orderId: customOrderId,
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

