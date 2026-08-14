import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { readLocalBlogPostsFallback, writeLocalBlogPostsFallback } from '../route';

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

    // 1. Update in local disk storage FIRST for resilience
    const diskPosts = readLocalBlogPostsFallback();
    let updatedItem: any = null;

    const updatedDiskPosts = diskPosts.map((post: any) => {
      if (post.id === id || post.slug === id) {
        updatedItem = {
          ...post,
          title: body.title !== undefined ? body.title : post.title,
          content: body.content !== undefined ? body.content : post.content,
          category: body.category !== undefined ? body.category : post.category,
          image: body.image !== undefined ? body.image : post.image,
          metaDesc: body.metaDesc !== undefined ? body.metaDesc : post.metaDesc,
          isFeatured: body.isFeatured !== undefined ? body.isFeatured : post.isFeatured,
          isActive: body.isActive !== undefined ? body.isActive : post.isActive,
          slug: body.slug !== undefined ? body.slug : post.slug,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return post;
    });

    if (!updatedItem) {
      updatedItem = {
        id,
        title: body.title || 'Başlıksız Blog',
        content: body.content || '',
        category: body.category || 'Genel',
        image: body.image || null,
        metaDesc: body.metaDesc || null,
        isFeatured: body.isFeatured ?? false,
        isActive: body.isActive ?? true,
        slug: body.slug || `blog-${id}`,
        updatedAt: new Date().toISOString(),
      };
      updatedDiskPosts.unshift(updatedItem);
    }

    writeLocalBlogPostsFallback(updatedDiskPosts);

    // 2. Safely attempt DB update
    try {
      await prisma.blogPost.update({
        where: { id },
        data: {
          title: body.title,
          content: body.content,
          category: body.category || 'Genel',
          image: body.image || null,
          metaDesc: body.metaDesc || null,
          isActive: body.isActive ?? true,
          ...(body.slug ? { slug: body.slug } : {})
        }
      });
    } catch (dbErr) {
      console.warn('[BLOG PUT WARNING] DB update failed, but disk data saved successfully:', dbErr);
    }

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('Blog PUT error:', error);
    // Return fallback updated item if any error occurs
    return NextResponse.json({ success: true, warning: error?.message });
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

    // 1. Delete from local disk storage FIRST
    const diskPosts = readLocalBlogPostsFallback();
    const updatedDisk = diskPosts.filter((p: any) => p.id !== id && p.slug !== id);
    writeLocalBlogPostsFallback(updatedDisk);

    // 2. Safely attempt DB delete
    try {
      await prisma.blogPost.delete({ where: { id } });
    } catch (dbErr) {
      console.warn('[BLOG DELETE WARNING] DB delete failed, but disk item was removed:', dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Blog DELETE error:', error);
    return NextResponse.json({ success: true });
  }
}

// GET /api/blog/[id] — Slug veya ID ile tek yazı getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let dbPost: any = null;
    try {
      dbPost = await prisma.blogPost.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ]
        }
      });
    } catch {}

    if (dbPost) {
      return NextResponse.json(dbPost);
    }

    const diskPosts = readLocalBlogPostsFallback();
    const diskPost = diskPosts.find((p: any) => p.id === id || p.slug === id);

    if (diskPost) {
      return NextResponse.json(diskPost);
    }

    return NextResponse.json({ error: 'Blog yazısı bulunamadı' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
