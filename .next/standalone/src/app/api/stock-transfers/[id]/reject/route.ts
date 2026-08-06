import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    // 1. Transfer talebini bul
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id }
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Stok transfer talebi bulunamadı.' }, { status: 404 });
    }

    if (transfer.status !== 'Bekliyor') {
      return NextResponse.json({ error: 'Bu transfer talebi zaten sonuçlandırılmış.' }, { status: 400 });
    }

    // 2. Transferi reddet
    const updatedTransfer = await prisma.stockTransfer.update({
      where: { id },
      data: {
        status: 'Reddedildi'
      }
    });

    return NextResponse.json({ success: true, transfer: updatedTransfer });

  } catch (error) {
    console.error('Error rejecting stock transfer:', error);
    return NextResponse.json({ error: 'Transfer reddedilirken bir hata oluştu.' }, { status: 500 });
  }
}
