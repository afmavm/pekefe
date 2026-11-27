import { NextRequest, NextResponse } from 'next/server';
import { queryPayTRStatus } from '@/lib/paytr';
import { withRateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

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
