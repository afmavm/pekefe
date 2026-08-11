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

    // Depo detaylarını bul (isimleri almak için)
    const fromWarehouse = await prisma.warehouse.findUnique({ where: { id: transfer.fromWarehouseId } });
    const toWarehouse = await prisma.warehouse.findUnique({ where: { id: transfer.toWarehouseId } });

    const fromName = fromWarehouse ? fromWarehouse.name : 'Kaynak Depo';
    const toName = toWarehouse ? toWarehouse.name : 'Hedef Depo';

    // 2. Transactional Update
    const result = await prisma.$transaction(async (tx) => {
      // A. Kaynak depoda yeterli stok var mı son kez kontrol et
      const sourceLocation = await tx.stockLocation.findFirst({
        where: {
          productId: transfer.productId,
          warehouseId: transfer.fromWarehouseId
        }
      });

      if (!sourceLocation || sourceLocation.stock < transfer.quantity) {
        throw new Error(`Yetersiz stok: Kaynak depoda transfer için yeterli stok bulunmuyor.`);
      }

      // B. Kaynak depodaki stoğu düş
      await tx.stockLocation.update({
        where: { id: sourceLocation.id },
        data: { stock: { decrement: transfer.quantity } }
      });

      // C. Hedef depodaki stoğu artır (yoksa oluştur)
      const targetLocation = await tx.stockLocation.findFirst({
        where: {
          productId: transfer.productId,
          warehouseId: transfer.toWarehouseId
        }
      });

      if (targetLocation) {
        await tx.stockLocation.update({
          where: { id: targetLocation.id },
          data: { stock: { increment: transfer.quantity } }
        });
      } else {
        await tx.stockLocation.create({
          data: {
            productId: transfer.productId,
            warehouseId: transfer.toWarehouseId,
            stock: transfer.quantity,
            rack: 'A-1'
          }
        });
      }

      // D. Global ürün stok logu (çift taraflı transfer logu)
      await tx.stockTransaction.create({
        data: {
          productId: transfer.productId,
          type: 'OUT',
          quantity: transfer.quantity,
          description: `${fromName} -> ${toName} stok transferi ile çıkış yapıldı (Talep No: ${transfer.id})`
        }
      });

      await tx.stockTransaction.create({
        data: {
          productId: transfer.productId,
          type: 'IN',
          quantity: transfer.quantity,
          description: `${fromName} -> ${toName} stok transferi ile giriş yapıldı (Talep No: ${transfer.id})`
        }
      });

      // E. Transfer talebinin durumunu güncelle
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: {
          status: 'Onaylandı'
        }
      });

      return updatedTransfer;
    });

    return NextResponse.json({ success: true, transfer: result });

  } catch (error: any) {
    console.error('Error approving stock transfer:', error);
    return NextResponse.json({ error: error.message || 'Transfer onaylanırken bir hata oluştu.' }, { status: 500 });
  }
}
