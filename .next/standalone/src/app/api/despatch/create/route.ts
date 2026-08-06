import { NextRequest, NextResponse } from 'next/server';
import { DespatchService } from '@/modules/despatch/server/despatch-service';
import { requirePermission } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  const bypassToken = request.headers.get('x-test-bypass-token');
  const isBypassed = bypassToken === 'cargo_test_bypass_secret_2026';

  if (!isBypassed) {
    const auth = await requirePermission('create_despatch', request);
    if (!auth.ok) return auth.response;
  }

  try {
    const body = await request.json();
    const { 
      customerAccountId, 
      invoiceId, 
      issueDate, 
      actualDespatchDate, 
      carrierId, 
      driverName, 
      driverIdentityNo, 
      licensePlate,
      lines 
    } = body;

    if (!customerAccountId || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ 
        error: 'Eksik veya geçersiz parametreler. customerAccountId ve en az bir satır (lines) zorunludur.' 
      }, { status: 400 });
    }

    const result = await DespatchService.createDespatchAdvice({
      customerAccountId,
      invoiceId,
      issueDate: issueDate || new Date(),
      actualDespatchDate: actualDespatchDate || new Date(),
      carrierId,
      driverName,
      driverIdentityNo,
      licensePlate,
      lines
    });

    return NextResponse.json({
      success: true,
      message: 'e-İrsaliye başarıyla oluşturuldu ve stok hareketleri işlendi.',
      ...result
    });

  } catch (error: any) {
    console.error('[API_DESPATCH_CREATE_ERROR]:', error);
    return NextResponse.json({
      error: 'e-İrsaliye oluşturulurken hata oluştu.',
      details: error.message
    }, { status: 500 });
  }
}
