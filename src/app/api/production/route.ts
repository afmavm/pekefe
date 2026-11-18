import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const [finishedGoods, rawMaterials, productionHistory] = await Promise.all([
      withTimeout(
        prisma.product.findMany({
          where: { isRawMaterial: false, isDeleted: false },
          include: {
            recipe: {
              include: {
                ingredient: true
              }
            }
          }
        }).catch(() => []),
        2500,
        []
      ),
      withTimeout(
        prisma.product.findMany({
          where: { isRawMaterial: true, isDeleted: false }
        }).catch(() => []),
        2500,
        []
      ),
      withTimeout(
        prisma.productionOrder.findMany({
          orderBy: { date: 'desc' },
          take: 20
        }).catch(() => []),
        2500,
        []
      )
    ]);

    return NextResponse.json({
      finishedGoods,
      rawMaterials,
      productionHistory
    }, { headers: NO_CACHE_HEADERS });

  } catch (error) {
    console.warn('[API PRODUCTION] Veritabanı erişimi yok, boş üretim verisi döndürülüyor:', error);
    return NextResponse.json({
      finishedGoods: [],
      rawMaterials: [],
      productionHistory: []
    }, { headers: NO_CACHE_HEADERS });
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
