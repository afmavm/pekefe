import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { syncProductTotalStock } from '@/modules/inventory/server/inventoryActions';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Resolve real DB ID if id is SKU
    const resolvedProduct = await prisma.product.findFirst({
      where: { OR: [{ id }, { sku: id }] },
      select: { id: true }
    });
    if (!resolvedProduct) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }
    const productId = resolvedProduct.id;

    // Fetch movements from StockTransaction
    const transactions = await prisma.stockTransaction.findMany({
      where: { productId },
      include: {
        warehouse: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Format to match frontend structure
    const formatted = transactions.map(t => {
      const typeStr = t.type === 'IN' ? 'Giriş (Mal Kabul)' : 
                      t.type === 'OUT' ? 'Çıkış (Sipariş/Sevk)' : t.type;
      
      // Format Date to YYYY-MM-DD HH:MM
      const d = new Date(t.date);
      const dateStr = d.toISOString().replace('T', ' ').substring(0, 16);

      return {
        id: t.id,
        date: dateStr,
        type: t.description || typeStr,
        warehouse: t.warehouse?.name || 'Genel Depo',
        qty: t.type === 'OUT' || t.type.includes('OUT') || t.type.includes('DEFICIT') ? -Math.abs(t.quantity) : Math.abs(t.quantity),
        user: t.userEmail || 'Sistem',
        status: 'Tamamlandı'
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({ error: 'İşlem geçmişi yüklenirken bir hata oluştu.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { type, warehouseName, qty } = body;

    if (!warehouseName || !qty) {
      return NextResponse.json({ error: 'Depo adı ve miktar gereklidir.' }, { status: 400 });
    }

    const resolvedProduct = await prisma.product.findFirst({
      where: { OR: [{ id }, { sku: id }] },
      select: { id: true }
    });
    if (!resolvedProduct) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }
    const productId = resolvedProduct.id;

    // Find warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { name: warehouseName }
    });
    if (!warehouse) {
      return NextResponse.json({ error: 'Depo bulunamadı.' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || 'Sistem Yöneticisi';

    const txType = type.includes('Giriş') ? 'IN' : 'OUT';
    const movementQty = Math.abs(qty);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check or Create StockLocation for this product in this warehouse
      const location = await tx.stockLocation.findFirst({
        where: {
          productId,
          warehouseId: warehouse.id
        }
      });

      if (txType === 'OUT') {
        if (!location || location.stock < movementQty) {
          throw new Error('Yetersiz stok! Belirtilen depoda bu miktarda çıkış yapılacak ürün bulunmuyor.');
        }
        await tx.stockLocation.update({
          where: { id: location.id },
          data: { stock: { decrement: movementQty } }
        });
      } else {
        if (location) {
          await tx.stockLocation.update({
            where: { id: location.id },
            data: { stock: { increment: movementQty } }
          });
        } else {
          await tx.stockLocation.create({
            data: {
              productId,
              warehouseId: warehouse.id,
              stock: movementQty
            }
          });
        }
      }

      // 2. Create StockTransaction
      const transaction = await tx.stockTransaction.create({
        data: {
          productId,
          warehouseId: warehouse.id,
          type: txType,
          quantity: movementQty,
          description: type,
          userEmail,
          moduleSource: 'MANUAL'
        }
      });

      return transaction;
    });

    // 3. Sync total stock on product table
    await syncProductTotalStock(productId);

    return NextResponse.json({ success: true, transaction: result });
  } catch (error: any) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json({ error: error.message || 'Stok hareketi işlenirken bir hata oluştu.' }, { status: 500 });
  }
}
