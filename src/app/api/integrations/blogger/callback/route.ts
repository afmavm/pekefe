import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  exchangeCodeForTokens,
  fetchBlogByUrl,
  fetchUserBlogs,
  getBloggerConfig,
  saveBloggerConfig,
} from '@/lib/blogger-sync';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/blogger/callback
 * Google OAuth 2.0 donusunu isler, refresh_token'i kaydeder ve kullanicinin Blogger bloglarini otomatik kesfeder.
 */
export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');
  const error = reqUrl.searchParams.get('error');
  const state = reqUrl.searchParams.get('state');

  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const isLocalDev =
    process.env.NODE_ENV !== 'production' &&
    (forwardedHost.startsWith('localhost') || forwardedHost.startsWith('127.0.0.1'));
  const baseOrigin = isLocalDev ? reqUrl.origin : 'https://www.pekefe.com';
  const redirectUri = `${baseOrigin}/api/integrations/blogger/callback`;

  if (error || !code) {
    return NextResponse.redirect(
      `${baseOrigin}/admin/blog?blogger=error&reason=${encodeURIComponent(error || 'cancelled')}`
    );
  }

  try {
    const cookieStore = await cookies();
    const expectedState = cookieStore.get('pekefe_blogger_oauth_state')?.value;
    if (expectedState && state && expectedState !== state) {
      return NextResponse.redirect(`${baseOrigin}/admin/blog?blogger=error&reason=invalid_state`);
    }

    const config = await getBloggerConfig();
    if (!config.clientId || !config.clientSecret) {
      return NextResponse.redirect(`${baseOrigin}/admin/blog?blogger=error&reason=missing_credentials`);
    }

    const tokens = await exchangeCodeForTokens(
      code,
      config.clientId,
      config.clientSecret,
      redirectUri
    );

    const finalRefreshToken = tokens.refreshToken || config.refreshToken;
    if (!finalRefreshToken) {
      return NextResponse.redirect(`${baseOrigin}/admin/blog?blogger=error&reason=no_refresh_token`);
    }

    // Auto-discover user's Blogger blogs
    let availableBlogs: Array<{ id: string; name: string; url: string }> = [];
    try {
      availableBlogs = await fetchUserBlogs(tokens.accessToken);
    } catch (e) {
      console.warn('[BLOGGER CALLBACK] fetchUserBlogs warning:', e);
    }

    let selectedBlog =
      availableBlogs.find((b) => b.id === config.blogId) ||
      availableBlogs.find(
        (b) => config.blogUrl && b.url.toLowerCase().includes(config.blogUrl.toLowerCase())
      ) ||
      availableBlogs[0] ||
      null;

    if (!selectedBlog && config.blogUrl) {
      selectedBlog = await fetchBlogByUrl(tokens.accessToken, config.blogUrl);
      if (selectedBlog) {
        availableBlogs = [selectedBlog, ...availableBlogs];
      }
    }

    await saveBloggerConfig({
      enabled: true,
      accessToken: tokens.accessToken,
      refreshToken: finalRefreshToken,
      tokenExpiresAt: tokens.expiresAt,
      connectedAt: new Date().toISOString(),
      availableBlogs,
      ...(selectedBlog
        ? {
            blogId: selectedBlog.id,
            blogName: selectedBlog.name,
            blogUrl: selectedBlog.url,
          }
        : {}),
    });

    const response = NextResponse.redirect(`${baseOrigin}/admin/blog?blogger=connected`);
    response.cookies.delete('pekefe_blogger_oauth_state');
    return response;
  } catch (err: any) {
    console.error('[BLOGGER CALLBACK ERROR]', err);
    return NextResponse.redirect(
      `${baseOrigin}/admin/blog?blogger=error&reason=${encodeURIComponent(err?.message || 'oauth_failed')}`
    );
  }
}
