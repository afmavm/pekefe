import { NextResponse } from 'next/server';
import { processProductionOrderAction } from '@/modules/production/server/productionActions';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Sipariş ID gerekli.' }, { status: 400 });
    }

    // Call the unified server action which handles NextAuth, warehouse locking,
    // StockLocation level increments/decrements, variants, and logs.
    const result = await processProductionOrderAction(orderId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Üretim tamamlanırken bir hata oluştu.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, order: result.data });

  } catch (error: any) {
    console.error('Production Completion API Error:', error);
    return NextResponse.json({ error: 'Üretim tamamlanırken sunucuda bir hata oluştu.' }, { status: 500 });
  }
}

