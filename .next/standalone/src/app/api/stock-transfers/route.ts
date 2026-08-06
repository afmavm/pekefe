import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      include: {
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Error fetching stock transfers:', error);
    return NextResponse.json({ error: 'Stok transferleri yüklenirken bir hata oluştu.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = body;

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return NextResponse.json({ error: 'Tüm zorunlu alanları doldurunuz.' }, { status: 400 });
    }

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json({ error: 'Kaynak depo ile hedef depo aynı olamaz.' }, { status: 400 });
    }

    if (Number(quantity) <= 0) {
      return NextResponse.json({ error: 'Transfer miktarı sıfırdan büyük olmalıdır.' }, { status: 400 });
    }

    // 1. Kaynak depoda yeterli stok olup olmadığını kontrol et
    const sourceLocation = await prisma.stockLocation.findFirst({
      where: {
        productId,
        warehouseId: fromWarehouseId
      }
    });

    const availableStock = sourceLocation ? sourceLocation.stock : 0;
    if (availableStock < Number(quantity)) {
      return NextResponse.json({
        error: `Yetersiz stok: Kaynak depoda sadece ${availableStock} adet mevcut. İstenen: ${quantity} adet.`
      }, { status: 400 });
    }

    // 2. Transfer talebini oluştur
    const transfer = await prisma.stockTransfer.create({
      data: {
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity: Number(quantity),
        notes: notes || null,
        status: 'Bekliyor',
        requester: auth.session?.user?.email || 'Admin'
      },
      include: {
        product: true
      }
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error) {
    console.error('Error creating stock transfer:', error);
    return NextResponse.json({ error: 'Stok transfer talebi oluşturulurken bir hata oluştu.' }, { status: 500 });
  }
}
