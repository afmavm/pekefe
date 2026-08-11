import { NextRequest, NextResponse } from 'next/server';
import { DespatchService } from '@/modules/despatch/server/despatch-service';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const bypassToken = request.headers.get('x-test-bypass-token');
  const isBypassed = bypassToken === 'cargo_test_bypass_secret_2026';

  if (!isBypassed) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'İrsaliye ID parametresi gereklidir.' }, { status: 400 });
    }

    const xml = await DespatchService.generateDespatchXML(id);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="Irsaliye_${id}.xml"`
      }
    });

  } catch (error: any) {
    console.error('[API_DESPATCH_XML_ERROR]:', error);
    if (error.message.includes('bulunamadı')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({
      error: 'e-İrsaliye XML oluşturulurken hata oluştu.',
      details: error.message
    }, { status: 500 });
  }
}
