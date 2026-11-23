import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { buildBloggerAuthUrl, getBloggerConfig } from '@/lib/blogger-sync';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/blogger/auth
 * Admin kullanicisini Google OAuth 2.0 (Blogger yetkisi) ekranina yonlendirir.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const config = await getBloggerConfig();
  if (!config.clientId || !config.clientSecret) {
    return NextResponse.redirect(
      new URL('/admin/blog?blogger=error&reason=missing_credentials', request.url)
    );
  }

  const reqUrl = new URL(request.url);
  const isLocal = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1';
  const redirectUri = isLocal
    ? `${reqUrl.origin}/api/integrations/blogger/callback`
    : 'https://www.pekefe.com/api/integrations/blogger/callback';

  const state = crypto.randomBytes(16).toString('hex');
  const googleAuthUrl = buildBloggerAuthUrl(config.clientId, redirectUri, state);

  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set('pekefe_blogger_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !isLocal,
    maxAge: 600,
    path: '/',
  });

  return response;
}
