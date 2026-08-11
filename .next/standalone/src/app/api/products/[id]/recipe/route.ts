import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeItems = await prisma.recipeItem.findMany({
      where: { mainProductId: id },
      include: {
        ingredient: true
      }
    });

    return NextResponse.json(recipeItems);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ error: 'Reçete yüklenirken bir hata oluştu.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { items } = body; // Array of { ingredientId: string, quantity: number, unit: string }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Geçersiz reçete içeriği.' }, { status: 400 });
    }

    // Save within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing items
      await tx.recipeItem.deleteMany({
        where: { mainProductId: id }
      });

      // 2. Create new items if there are any
      if (items.length > 0) {
        const createData = items.map((item: any) => ({
          mainProductId: id,
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity),
          unit: item.unit || 'Adet'
        }));

        // Loop to create to satisfy foreign keys
        for (const c of createData) {
          await tx.recipeItem.create({
            data: c
          });
        }
      }

      // 3. Fetch and return updated recipe items
      return await tx.recipeItem.findMany({
        where: { mainProductId: id },
        include: { ingredient: true }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving recipe:', error);
    return NextResponse.json({ error: 'Reçete kaydedilirken bir hata oluştu.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    await prisma.recipeItem.deleteMany({
      where: { mainProductId: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Reçete silinirken bir hata oluştu.' }, { status: 500 });
  }
}
