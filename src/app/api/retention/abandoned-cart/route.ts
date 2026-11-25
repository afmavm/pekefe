import { NextResponse } from 'next/server';
import {
  getRetentionConfig,
  markAbandonedCartRecovered,
  upsertAbandonedCart,
} from '@/lib/retention-service';
import { getPublishedProductsServer } from '@/lib/category-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/retention/abandoned-cart?recover=<cartId>
 * Sihirli Sepet Kurtarma: Musteri farkli tarayici/cihazdan mail/WhatsApp linkine tikladiginda
 * sepet urunlerini PII (kisisel veri) sizdirmadan geri yukler.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = (searchParams.get('recover') || '').trim();
    if (!cartId) {
      return NextResponse.json({ items: [] }, { status: 400 });
    }

    // Test e-postasi linki icin canli katalogdan ilk 2 aktif urunu dondur
    if (cartId === 'test-cart') {
      const liveProducts = await getPublishedProductsServer().catch(() => []);
      const sample = liveProducts.slice(0, 2).map((p: any) => ({
        id: String(p.id),
        productId: String(p.id),
        sku: String(p.sku || p.id),
        name: String(p.name || 'PEKEFE Ürün'),
        price: Number(p.price || 0),
        quantity: 1,
        stock: Number(p.stock || 50),
        image: p.image || '/pekefe-dut-pekmezi-kavanoz-tr.jpg',
      }));
      return NextResponse.json({ found: sample.length > 0, items: sample, isTest: true });
    }

    const config = await getRetentionConfig();
    const cart = config.abandonedCarts.find((c) => c.id === cartId);
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json({ found: false, items: [] });
    }

    return NextResponse.json({
      found: true,
      items: cart.items.map((i) => ({
        id: i.id,
        productId: i.id,
        name: i.name,
        price: Number(i.price || 0),
        quantity: Math.max(1, Number(i.quantity || 1)),
        image: i.image || '/pekefe-dut-pekmezi-kavanoz-tr.jpg',
        variantLabel: i.variantLabel || '',
      })),
    });
  } catch {
    return NextResponse.json({ found: false, items: [] }, { status: 200 });
  }
}

/**
 * POST /api/retention/abandoned-cart
 * Odeme sayfasinda musteri e-posta/telefon girdiginde sepeti kaydeder,
 * siparis tamamlandiginda (action: "recover") kurtarildi olarak isaretler.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === 'recover') {
      const recovered = await markAbandonedCartRecovered({
        email: body.email,
        phone: body.phone,
        orderId: body.orderId,
      });
      return NextResponse.json({ success: true, recovered });
    }

    const items = Array.isArray(body.items)
      ? body.items
          .filter((i: any) => i && (i.name || i.title))
          .map((i: any) => ({
            id: String(i.id || i.productId || ''),
            name: String(i.name || i.title || 'PEKEFE Ürün').replace(/<[^>]+>/g, '').trim(),
            price: Number(i.price || 0),
            quantity: Math.max(1, Number(i.quantity || i.qty || 1)),
            image: i.image || i.img || undefined,
            variantLabel: i.variantLabel || undefined,
          }))
      : [];

    if (items.length === 0) {
      return NextResponse.json({ success: false, skipped: true });
    }

    const subtotal =
      Number(body.subtotal || 0) ||
      items.reduce((acc: number, i: any) => acc + i.price * i.quantity, 0);

    const record = await upsertAbandonedCart({
      sessionKey: body.sessionKey,
      customerName: body.customerName,
      email: body.email,
      phone: body.phone,
      items,
      subtotal,
    });

    return NextResponse.json({
      success: Boolean(record),
      id: record?.id || null,
    });
  } catch (error: any) {
    console.warn('[RETENTION CAPTURE ERROR]', error?.message);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
