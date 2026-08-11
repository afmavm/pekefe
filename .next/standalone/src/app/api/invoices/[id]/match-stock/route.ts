import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const ettn_no = resolvedParams.id;
    
    const body = await request.json();
    const { item_code, stock_id } = body;

    if (!item_code || !stock_id) {
      return NextResponse.json(
        { error: 'Eksik parametre. item_code ve stock_id alanları zorunludur.' },
        { status: 400 }
      );
    }

    await prisma.$executeRaw`UPDATE stocks SET supplier_part_no = ${item_code} WHERE stock_id = ${stock_id}`;

    await prisma.$executeRaw`UPDATE incoming_e_invoices 
       SET status = 'Pending', error_message = NULL, updated_at = ${new Date()} 
       WHERE ettn_no = ${ettn_no}`;

    return NextResponse.json({
      success: true,
      message: `Ürün kodu (${item_code}) stok kartı (${stock_id}) ile başarıyla eşleştirildi ve kalıcı hafızaya eklendi.`
    });

  } catch (error: any) {
    console.error('[API_INCOMING_INVOICE_MATCH_STOCK_ERROR]:', error);
    return NextResponse.json(
      { error: 'Stok kartı eşleştirilirken veritabanı hatası oluştu.', details: error.message },
      { status: 500 }
    );
  }
}
