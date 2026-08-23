import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPayTRToken } from '@/lib/paytr';
import { generateNextOrderId } from '@/lib/b2b-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { saveLocalOrder } from '@/lib/jsonOrderDb';

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

    // Extract customer IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Generate Unique Order ID (e.g. PKF-2026-0001 -> PKF20260001)
    const rawOrderId = await generateNextOrderId();
    const customOrderId = rawOrderId.replace(/[^a-zA-Z0-9]/g, '');
    const grandTotal = Number(cartTotal);
    const customerEmail = email || `${phone.replace(/\D/g, '')}@pekefe.com`;

    let accountId = 'guest-account';
    const fullAddress = `${address}${district ? `, ${district}` : ''} / ${city}`;
    const orderSummary = `${selectedCarrierName ? `[${selectedCarrierName}] ` : ''}` + cart.map((item: any) => `${item.name} (${item.quantity})`).join(", ");

    try {
      let account = await prisma.currentAccount.findFirst({
        where: { email: customerEmail }
      });

      if (account) {
        account = await prisma.currentAccount.update({
          where: { id: account.id },
          data: {
            phone: phone || account.phone,
            address: fullAddress || account.address,
          }
        });
      } else {
        account = await prisma.currentAccount.create({
          data: {
            name: name,
            email: customerEmail,
            phone: phone,
            address: fullAddress,
            type: 'B2C',
            cariTipi: 'INDIVIDUAL',
          }
        });
      }
      accountId = account.id;

      await prisma.order.create({
        data: {
          id: customOrderId,
          currentAccountId: accountId,
          total: grandTotal,
          shippingFee: Number(shippingFee),
          status: 'Ödeme Bekliyor',
          summary: orderSummary,
          type: 'B2C',
          method: 'PayTR 3D Secure Kredi Kartı',
        },
      });
    } catch (dbErr) {
      console.warn("[PAYTR TOKEN DB WARNING] Veritabanına taslak sipariş yazılamadı, yerel depolama devreye giriyor:", dbErr);
    }

    // Always save order to local disk DB as fail-safe guarantee
    try {
      saveLocalOrder({
        id: customOrderId,
        orderNumber: customOrderId,
        client: name,
        customerName: name,
        email: customerEmail,
        phone: phone,
        address: fullAddress,
        date: new Date().toISOString(),
        status: 'Ödeme Bekliyor',
        amount: grandTotal,
        total: grandTotal,
        shippingFee: Number(shippingFee),
        type: 'B2C',
        method: 'PayTR 3D Secure Kredi Kartı',
        summary: orderSummary,
        cargoCompany: selectedCarrierName,
        items: cart
      });
    } catch (localErr) {
      console.error("Local order save failed:", localErr);
    }

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

