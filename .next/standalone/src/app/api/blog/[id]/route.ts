import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

// PUT /api/blog/[id] — Blog yazısını güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        category: body.category || 'Genel',
        image: body.image || null,
        metaDesc: body.metaDesc || null,
        isActive: body.isActive ?? true,
        // Slug güncelleme: eğer başlık değişmişse
        ...(body.slug ? { slug: body.slug } : {})
      }
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Blog PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/blog/[id] — Blog yazısını sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Blog DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/blog/[id] — Slug veya ID ile tek yazı getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Slug veya ID ile ara
    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Blog yazısı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
