import { NextRequest, NextResponse } from 'next/server';
import { queryPayTRStatus } from '@/lib/paytr';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'apiLimit');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { merchantOid } = body;

    if (!merchantOid) {
      return NextResponse.json({ error: 'merchantOid (sipariş numarası) zorunludur.' }, { status: 400 });
    }

    const result = await queryPayTRStatus(merchantOid);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Durum sorgulama hatası.' }, { status: 500 });
  }
}
