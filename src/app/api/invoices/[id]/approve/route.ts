import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UBLInvoiceProcessor } from '@/lib/ubl-invoice-processor';
import { requirePermission } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission('approve_invoice', request);
  if (!auth.ok) return auth.response;

  try {
    const resolvedParams = await params;
    const ettn_no = resolvedParams.id;

    // Faturayı gelen kutusu kuyruğundan çek
    const incomingRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT xml_content, status FROM incoming_e_invoices WHERE ettn_no = $1 LIMIT 1',
      ettn_no
    );

    if (!incomingRows || incomingRows.length === 0) {
      return NextResponse.json(
        { error: 'Belirtilen e-Fatura gelen kutusunda bulunamadı.' },
        { status: 404 }
      );
    }

    const { xml_content, status } = incomingRows[0];

    if (status === 'Processed') {
      return NextResponse.json(
        { error: 'Bu e-Fatura zaten başarıyla işlenmiş durumda.' },
        { status: 400 }
      );
    }

    // Faturayı tekrar işlemeyi dene (cari/stok kartı eksiklikleri giderildiyse başarılı olacaktır)
    const result = await UBLInvoiceProcessor.processEInvoice(xml_content);

    if (result.success) {
      return NextResponse.json({
        success: true,
        invoiceId: result.invoiceId,
        status: result.status,
        message: 'Fatura başarıyla onaylandı ve stok/cari hareketleri veritabanına işlendi.'
      });
    } else {
      return NextResponse.json({
        success: false,
        status: result.status,
        error: result.error,
        message: 'Fatura onaylanamadı. Lütfen eşleşme eksikliklerini giderip tekrar deneyin.'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[API_INCOMING_INVOICE_APPROVE_ERROR]:', error);
    return NextResponse.json(
      { error: 'Fatura onaylanırken beklenmeyen bir hata oluşti.', details: error.message },
      { status: 500 }
    );
  }
}
