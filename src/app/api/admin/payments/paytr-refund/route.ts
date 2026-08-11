import { NextRequest, NextResponse } from 'next/server';
import { refundPayTROrder } from '@/lib/paytr';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'apiLimit');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { merchantOid, returnAmount, referenceNo } = body;

    if (!merchantOid || !returnAmount) {
      return NextResponse.json({ error: 'merchantOid ve returnAmount zorunludur.' }, { status: 400 });
    }

    const result = await refundPayTROrder({
      merchantOid,
      returnAmount: Number(returnAmount),
      referenceNo,
    });

    if (result.success) {
      // Sipariş durumunu İptal/İade Edildi olarak güncelle
      await prisma.order.update({
        where: { id: merchantOid },
        data: {
          status: 'İptal / İade Edildi',
        },
      }).catch((err) => console.error('[PAYTR REFUND DB UPDATE ERROR]:', err));
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'İade işlemi hatası.' }, { status: 500 });
  }
}
