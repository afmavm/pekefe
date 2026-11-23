import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { readLocalBlogPostsFallback } from '@/app/api/blog/route';
import { getBloggerConfig, getPublicBloggerConfig, syncPostToBlogger } from '@/lib/blogger-sync';

export const dynamic = 'force-dynamic';

async function loadAllBlogPosts(): Promise<any[]> {
  let dbPosts: any[] = [];
  try {
    dbPosts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  } catch {}

  const diskPosts = readLocalBlogPostsFallback();
  const merged = new Map<string, any>();
  diskPosts.forEach((p: any) => merged.set(p.id, p));
  dbPosts.forEach((p: any) => merged.set(p.id, { ...merged.get(p.id), ...p }));
  return Array.from(merged.values());
}

/**
 * POST /api/integrations/blogger/sync
 * Body: { postId?: string, all?: boolean }
 * Tek bir blog yazisini veya tum aktif blog yazilarini Google Blogger'a senkronize eder.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const config = await getBloggerConfig();

    if (!config.refreshToken || !config.blogId) {
      return NextResponse.json(
        { error: 'Google Blogger hesabi bagli degil veya hedef blog secilmemis.' },
        { status: 400 }
      );
    }

    const allPosts = await loadAllBlogPosts();

    if (body.postId) {
      const target = allPosts.find(
        (p) => p.id === body.postId || p.slug === body.postId
      );
      if (!target) {
        return NextResponse.json({ error: 'Blog yazisi bulunamadi.' }, { status: 404 });
      }

      const result = await syncPostToBlogger(target, { force: true });
      const updatedConfig = await getBloggerConfig();
      return NextResponse.json({
        success: result.synced,
        result,
        config: getPublicBloggerConfig(updatedConfig),
      });
    }

    // Bulk sync all active posts
    const targets = allPosts.filter((p) => p && p.isActive !== false && p.title && p.content);
    const results: Array<{ id: string; title: string; synced: boolean; action?: string; error?: string }> = [];

    for (const post of targets) {
      const res = await syncPostToBlogger(post, { force: true });
      results.push({
        id: post.id,
        title: post.title,
        synced: res.synced,
        action: res.action,
        error: res.error,
      });
    }

    const updatedConfig = await getBloggerConfig();
    const successCount = results.filter((r) => r.synced).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: failCount === 0,
      total: results.length,
      successCount,
      failCount,
      results,
      config: getPublicBloggerConfig(updatedConfig),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Senkronizasyon sirasinda hata olustu.' },
      { status: 500 }
    );
  }
}
