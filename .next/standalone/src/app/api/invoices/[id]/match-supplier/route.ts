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
    const { supplier_id, supplier_vkn } = body;

    if (!supplier_id || !supplier_vkn) {
      return NextResponse.json(
        { error: 'Eksik parametre. supplier_id ve supplier_vkn alanları zorunludur.' },
        { status: 400 }
      );
    }

    await prisma.$executeRaw`UPDATE suppliers SET tax_no = ${supplier_vkn} WHERE supplier_id = ${supplier_id}`;

    await prisma.$executeRaw`UPDATE incoming_e_invoices 
       SET status = 'Pending', error_message = NULL, updated_at = ${new Date()} 
       WHERE ettn_no = ${ettn_no}`;

    return NextResponse.json({
      success: true,
      message: `Tedarikçi cari kartı vergi numarası (${supplier_vkn}) ile başarıyla güncellendi.`
    });

  } catch (error: any) {
    console.error('[API_INCOMING_INVOICE_MATCH_SUPPLIER_ERROR]:', error);
    return NextResponse.json(
      { error: 'Cari kart eşleştirilirken veritabanı hatası oluştu.', details: error.message },
      { status: 500 }
    );
  }
}
