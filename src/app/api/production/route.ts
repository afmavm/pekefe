import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    // Fetch finished goods (mamul) with their BOM
    const finishedGoods = await prisma.product.findMany({
      where: { isRawMaterial: false, isDeleted: false },
      include: {
        recipe: {
          include: {
            ingredient: true
          }
        }
      }
    });

    // Fetch raw materials (hammadde)
    const rawMaterials = await prisma.product.findMany({
      where: { isRawMaterial: true, isDeleted: false }
    });

    // Fetch recent production orders
    const productionHistory = await prisma.productionOrder.findMany({
      orderBy: { date: 'desc' },
      take: 20
    });

    return NextResponse.json({
      finishedGoods,
      rawMaterials,
      productionHistory
    });

  } catch (error) {
    console.error('Error fetching production data:', error);
    return NextResponse.json({ error: 'Veritabanı hatası' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { productId, quantity } = await request.json();

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Geçersiz üretim verisi' }, { status: 400 });
    }

    // 1. Fetch Product and its BOM
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        recipe: {
          include: { ingredient: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    if (product.isRawMaterial) {
      return NextResponse.json({ error: 'Hammadde doğrudan üretilemez' }, { status: 400 });
    }

    if (!product.recipe || product.recipe.length === 0) {
      return NextResponse.json({ error: 'Bu ürünün üretim reçetesi (BOM) bulunmamaktadır' }, { status: 400 });
    }

    // 2. Stock validation (Do we have enough raw materials?)
    const missingMaterials = [];
    for (const item of product.recipe) {
      const requiredQty = item.quantity * quantity;
      if (item.ingredient.stock < requiredQty) {
        missingMaterials.push({
          name: item.ingredient.name,
          required: requiredQty,
          available: item.ingredient.stock
        });
      }
    }

    if (missingMaterials.length > 0) {
      return NextResponse.json({ 
        error: 'Yetersiz hammadde stoku', 
        missing: missingMaterials 
      }, { status: 400 });
    }

    // 3. Execute Production Transaction
    await prisma.$transaction(async (tx) => {
      
      // A) Consume Raw Materials
      for (const item of product.recipe) {
        const consumedQty = item.quantity * quantity;
        
        await tx.product.update({
          where: { id: item.ingredientId },
          data: { stock: { decrement: consumedQty } }
        });

        await tx.stockTransaction.create({
          data: {
            productId: item.ingredientId,
            type: "PRODUCTION_CONSUMPTION",
            quantity: -consumedQty,
            description: `${quantity} Adet ${product.name} üretimi için tüketim`
          }
        });
      }

      // B) Increase Finished Good Stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } }
      });

      await tx.stockTransaction.create({
        data: {
          productId: productId,
          type: "PRODUCTION",
          quantity: quantity,
          description: `Üretim emri ile eklendi`
        }
      });

      // C) Log Production Order
      await tx.productionOrder.create({
        data: {
          productId: productId,
          quantity: quantity,
          status: "COMPLETED"
        }
      });

    });

    return NextResponse.json({ message: 'Üretim başarıyla tamamlandı ve stoklar güncellendi.' });

  } catch (error) {
    console.error('Error executing production:', error);
    return NextResponse.json({ error: 'Üretim sırasında bir hata oluştu' }, { status: 500 });
  }
}
