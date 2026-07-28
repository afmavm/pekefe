import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.BYPASS_AUTH !== 'true') {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
  }

  try {
    const resolvedParams = await params;
    const supplierId = resolvedParams.id;

    // Check if supplier exists
    const supplierRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT supplier_id, supplier_name, supplier_code, tax_no, balance FROM suppliers WHERE supplier_id = $1 LIMIT 1',
      supplierId
    );

    if (!supplierRows || supplierRows.length === 0) {
      return NextResponse.json(
        { error: 'Belirtilen tedarikçi bulunamadı.' },
        { status: 404 }
      );
    }

    // Query open (unpaid / partially paid) invoices ordered by date (FIFO order)
    const openInvoices = await prisma.$queryRawUnsafe<any[]>(
      `SELECT invoice_id, invoice_no, ettn_no, invoice_date, currency, exchange_rate, 
              total_net_amount, total_vat_amount, total_gross_amount, open_amount, status, notes
       FROM invoice_headers 
       WHERE supplier_id = $1 AND status != 'Paid' AND open_amount > 0
       ORDER BY invoice_date ASC, invoice_no ASC`,
      supplierId
    );

    return NextResponse.json({
      supplier: supplierRows[0],
      invoices: openInvoices
    });
  } catch (error: any) {
    console.error('[API_SUPPLIER_OPEN_INVOICES_GET_ERROR]:', error);
    return NextResponse.json(
      { error: 'Açık faturalar çekilirken bir hata oluştu.', details: error.message },
      { status: 500 }
    );
  }
}
