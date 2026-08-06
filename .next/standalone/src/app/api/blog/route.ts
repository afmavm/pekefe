import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/blog — Aktif blog yazılarını listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';
    
    const posts = await prisma.blogPost.findMany({
      where: adminMode ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Blog GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/blog — Yeni blog yazısı oluştur (admin only)
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Başlık ve içerik zorunludur.' }, { status: 400 });
    }

    // Slug oluştur
    let slug = body.slug || body.title
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Slug benzersizliği
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug,
        content: body.content,
        category: body.category || 'Genel',
        image: body.image || null,
        metaDesc: body.metaDesc || null,
        isActive: body.isActive ?? true,
      }
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Blog POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
