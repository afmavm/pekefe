import { NextResponse } from 'next/server';
import {
  markAbandonedCartRecovered,
  upsertAbandonedCart,
} from '@/lib/retention-service';

export const dynamic = 'force-dynamic';

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
