import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const categories = await prisma.categoryDetail.findMany();
    return NextResponse.json(categories.map(c => ({
      ...c,
      attributes: c.attributes as any,
      variants: c.variants as any
    })));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Kategori oluştur (Admin only)
export const POST = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      
      let customId = body.id;
      if (!customId || customId.startsWith("cms")) {
        const count = await prisma.categoryDetail.count();
        customId = `PKF-KAT-${String(count + 1).padStart(3, '0')}`;
      }

      const category = await prisma.categoryDetail.create({
        data: {
          id: customId,
          name: body.name,
          parentId: body.parentId ? String(body.parentId) : null,
          attributes: body.attributes || [],
          variants: body.variants || []
        }
      });
      revalidatePath('/kategoriler');
      revalidatePath('/', 'layout');
      return NextResponse.json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Kategori güncelle (Admin only)
export const PUT = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const category = await prisma.categoryDetail.update({
        where: { id: body.id },
        data: {
          name: body.name,
          parentId: body.parentId ? String(body.parentId) : null,
          attributes: body.attributes || [],
          variants: body.variants || []
        }
      });
      revalidatePath('/kategoriler');
      revalidatePath('/', 'layout');
      return NextResponse.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Kategori sil (Admin only)
export const DELETE = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

      await prisma.categoryDetail.delete({ where: { id } });
      revalidatePath('/kategoriler');
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
