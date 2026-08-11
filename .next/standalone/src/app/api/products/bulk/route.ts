import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-helpers';

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Body must be an array of products' }, { status: 400 });
    }

    // Execute in a transaction for atomicity
    const updates: any[] = [];
    for (const p of body) {
      // Keep existing attributes and overlay any updated ones if they exist
      const attributesObj = typeof p.attributes === 'string' 
        ? JSON.parse(p.attributes) 
        : (p.attributes || {});

      updates.push(
        prisma.product.update({
          where: { id: p.id },
          data: {
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: Number(p.price || 0),
            sale_price: Number(p.price || 0),
            b2b_base_price: Number(p.price || 0),
            cost: Number(p.cost || 0),
            stock: Number(p.stock || 0),
            criticalLimit: Number(p.criticalLimit || 0),
            attributes: attributesObj,
            isRawMaterial: p.isRawMaterial ?? false
          }
        })
      );

      updates.push(
        prisma.productB2BPrice.updateMany({
          where: { productId: p.id },
          data: { price: Number(p.price || 0) }
        })
      );
    }

    await prisma.$transaction(updates);

    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
