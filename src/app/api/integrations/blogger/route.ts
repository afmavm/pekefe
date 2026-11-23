import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import {
  DEFAULT_BLOGGER_CONFIG,
  fetchBlogByUrl,
  fetchUserBlogs,
  getBloggerConfig,
  getPublicBloggerConfig,
  getValidAccessToken,
  saveBloggerConfig,
} from '@/lib/blogger-sync';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/blogger
 * Google Blogger entegrasyon ayarlarini ve durumunu dondurur (secret/token gizli).
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const config = await getBloggerConfig();
    return NextResponse.json(getPublicBloggerConfig(config));
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Blogger ayarlari alinamadi.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/blogger
 * Ayarlari kaydeder, baglantiyi test eder, blog listesini yeniler veya baglantiyi keser.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const action = body.action || 'save';

    if (action === 'disconnect') {
      const current = await getBloggerConfig();
      const updated = await saveBloggerConfig({
        ...DEFAULT_BLOGGER_CONFIG,
        clientId: current.clientId,
        clientSecret: current.clientSecret,
        postMap: current.postMap,
      });
      return NextResponse.json({
        success: true,
        config: getPublicBloggerConfig(updated),
      });
    }

    if (action === 'refresh-blogs') {
      const current = await getBloggerConfig();
      const accessToken = await getValidAccessToken(current);
      const blogs = await fetchUserBlogs(accessToken);

      let selectedBlog = blogs.find((b) => b.id === current.blogId) || blogs[0] || null;
      if (!selectedBlog && current.blogUrl) {
        selectedBlog = await fetchBlogByUrl(accessToken, current.blogUrl);
      }

      const updated = await saveBloggerConfig({
        availableBlogs: blogs,
        ...(selectedBlog
          ? {
              blogId: selectedBlog.id,
              blogName: selectedBlog.name,
              blogUrl: selectedBlog.url,
            }
          : {}),
      });

      return NextResponse.json({
        success: true,
        blogs,
        config: getPublicBloggerConfig(updated),
      });
    }

    // Default: save settings
    const current = await getBloggerConfig();
    const patch: Record<string, any> = {};

    if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
    if (typeof body.autoSync === 'boolean') patch.autoSync = body.autoSync;
    if (typeof body.syncDelete === 'boolean') patch.syncDelete = body.syncDelete;
    if (typeof body.appendBacklink === 'boolean') patch.appendBacklink = body.appendBacklink;

    if (typeof body.clientId === 'string') patch.clientId = body.clientId.trim();
    if (typeof body.clientSecret === 'string' && body.clientSecret.trim() !== '') {
      patch.clientSecret = body.clientSecret.trim();
    }
    if (typeof body.blogId === 'string') patch.blogId = body.blogId.trim();
    if (typeof body.blogName === 'string') patch.blogName = body.blogName.trim();
    if (typeof body.blogUrl === 'string') patch.blogUrl = body.blogUrl.trim();

    // If user selected a blog from availableBlogs, auto-fill name & url
    if (patch.blogId && Array.isArray(current.availableBlogs)) {
      const match = current.availableBlogs.find((b) => b.id === patch.blogId);
      if (match) {
        patch.blogName = match.name;
        patch.blogUrl = match.url;
      }
    }

    const updated = await saveBloggerConfig(patch);

    // If already authenticated and user entered a blogUrl without blogId, auto-resolve it
    if (updated.refreshToken && updated.blogUrl && !updated.blogId) {
      try {
        const token = await getValidAccessToken(updated);
        const found = await fetchBlogByUrl(token, updated.blogUrl);
        if (found) {
          const resolved = await saveBloggerConfig({
            blogId: found.id,
            blogName: found.name,
            blogUrl: found.url,
          });
          return NextResponse.json({
            success: true,
            config: getPublicBloggerConfig(resolved),
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      config: getPublicBloggerConfig(updated),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Blogger ayarlari kaydedilemedi.' },
      { status: 500 }
    );
  }
}
