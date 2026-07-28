import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  // Yönetici yetki kontrolü
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'All';
    const lists = searchParams.get('lists') === 'true';

    if (lists) {
      // Dropdown eşleştirmeleri için verileri çekiyoruz
      const suppliers = await prisma.$queryRawUnsafe<any[]>(
        'SELECT supplier_id AS id, supplier_name AS name, tax_no FROM suppliers ORDER BY name'
      );
      const stocks = await prisma.$queryRawUnsafe<any[]>(
        'SELECT stock_id AS id, stock_name AS name, stock_code AS code, barcode, current_cost FROM stocks ORDER BY name'
      );
      const warehouses = await prisma.$queryRawUnsafe<any[]>(
        'SELECT warehouse_id AS id, warehouse_name AS name FROM warehouses ORDER BY name'
      );

      return NextResponse.json({ suppliers, stocks, warehouses });
    }
    
    let query = `
      SELECT ettn_no, invoice_no, supplier_vkn, invoice_date, total_gross_amount, 
             currency, exchange_rate, status, error_message, processed_invoice_id, 
             created_at, updated_at 
      FROM incoming_e_invoices
    `;
    const params: any[] = [];
    
    if (status && status !== 'All') {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';

    const invoices = await prisma.$queryRawUnsafe<any[]>(query, ...params);
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('[API_INCOMING_INVOICES_GET_ERROR]:', error);
    return NextResponse.json(
      { error: 'Gelen fatura listesi çekilirken veritabanı hatası oluştu.', details: error.message },
      { status: 500 }
    );
  }
}
