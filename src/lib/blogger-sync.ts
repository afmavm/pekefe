import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const INTEGRATION_ID = 'google-blogger';
const SITE_URL = 'https://www.pekefe.com';
const BLOGGER_API_BASE = 'https://www.googleapis.com/blogger/v3';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const LOCAL_CONFIG_PATH = path.join(process.cwd(), 'data', 'blogger_integration.json');

export interface BloggerPostMapping {
  bloggerPostId: string;
  bloggerUrl?: string;
  syncedAt: string;
  lastError?: string | null;
  isDraft?: boolean;
}

export interface BloggerAvailableBlog {
  id: string;
  name: string;
  url: string;
}

export interface BloggerConfig {
  enabled: boolean;
  autoSync: boolean;
  syncDelete: boolean;
  appendBacklink: boolean;
  clientId: string;
  clientSecret: string;
  blogId: string;
  blogName: string;
  blogUrl: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  connectedEmail?: string;
  connectedAt?: string;
  lastSync?: string;
  availableBlogs?: BloggerAvailableBlog[];
  postMap: Record<string, BloggerPostMapping>;
}

export const DEFAULT_BLOGGER_CONFIG: BloggerConfig = {
  enabled: false,
  autoSync: true,
  syncDelete: false,
  appendBacklink: true,
  clientId: '',
  clientSecret: '',
  blogId: '',
  blogName: '',
  blogUrl: '',
  accessToken: '',
  refreshToken: '',
  tokenExpiresAt: 0,
  connectedEmail: '',
  connectedAt: '',
  lastSync: '',
  availableBlogs: [],
  postMap: {},
};

function readLocalConfig(): Partial<BloggerConfig> | null {
  try {
    if (fs.existsSync(LOCAL_CONFIG_PATH)) {
      const raw = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[BLOGGER] Local config read error:', err);
  }
  return null;
}

function writeLocalConfig(config: BloggerConfig): void {
  try {
    const dir = path.dirname(LOCAL_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[BLOGGER] Local config write error:', err);
  }
}

export async function getBloggerConfig(): Promise<BloggerConfig> {
  let dbSettings: Partial<BloggerConfig> | null = null;
  try {
    const row = await prisma.integration.findUnique({
      where: { id: INTEGRATION_ID },
    });
    if (row?.settings && typeof row.settings === 'object') {
      dbSettings = row.settings as Partial<BloggerConfig>;
    }
  } catch (err) {
    console.warn('[BLOGGER] DB read fallback:', err);
  }

  const localSettings = readLocalConfig();
  const merged: BloggerConfig = {
    ...DEFAULT_BLOGGER_CONFIG,
    ...(localSettings || {}),
    ...(dbSettings || {}),
    postMap: {
      ...(localSettings?.postMap || {}),
      ...(dbSettings?.postMap || {}),
    },
  };

  // Optional environment fallbacks if not set in admin panel
  if (!merged.clientId && process.env.GOOGLE_BLOGGER_CLIENT_ID) {
    merged.clientId = process.env.GOOGLE_BLOGGER_CLIENT_ID;
  }
  if (!merged.clientSecret && process.env.GOOGLE_BLOGGER_CLIENT_SECRET) {
    merged.clientSecret = process.env.GOOGLE_BLOGGER_CLIENT_SECRET;
  }

  return merged;
}

export async function saveBloggerConfig(
  patch: Partial<BloggerConfig>
): Promise<BloggerConfig> {
  const current = await getBloggerConfig();
  const next: BloggerConfig = {
    ...current,
    ...patch,
    postMap: patch.postMap !== undefined ? patch.postMap : current.postMap,
  };

  writeLocalConfig(next);

  const isConnected = Boolean(next.refreshToken && next.blogId);
  const status = isConnected ? (next.enabled ? 'active' : 'paused') : 'disconnected';

  try {
    await prisma.integration.upsert({
      where: { id: INTEGRATION_ID },
      update: {
        status,
        lastSync: next.lastSync || null,
        settings: next as any,
      },
      create: {
        id: INTEGRATION_ID,
        name: 'Google Blogger',
        type: 'blog',
        status,
        lastSync: next.lastSync || null,
        logo: 'blogger',
        settings: next as any,
      },
    });
  } catch (err) {
    console.warn('[BLOGGER] DB save warning (saved to local fallback):', err);
  }

  return next;
}

export function getPublicBloggerConfig(config: BloggerConfig) {
  const isConnected = Boolean(config.refreshToken && (config.blogId || (config.availableBlogs && config.availableBlogs.length > 0)));
  return {
    enabled: config.enabled,
    autoSync: config.autoSync,
    syncDelete: config.syncDelete,
    appendBacklink: config.appendBacklink,
    clientId: config.clientId,
    hasClientSecret: Boolean(config.clientSecret),
    blogId: config.blogId,
    blogName: config.blogName,
    blogUrl: config.blogUrl,
    isConnected,
    connectedAt: config.connectedAt || null,
    lastSync: config.lastSync || null,
    availableBlogs: config.availableBlogs || [],
    syncedCount: Object.keys(config.postMap || {}).length,
    postMap: config.postMap || {},
    redirectUri: `${SITE_URL}/api/integrations/blogger/callback`,
  };
}

export function buildBloggerAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/blogger',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Google OAuth token alinamadi.');
  }

  return {
    accessToken: String(data.access_token || ''),
    refreshToken: String(data.refresh_token || ''),
    expiresAt: Date.now() + Number(data.expires_in || 3500) * 1000,
  };
}

export async function getValidAccessToken(config?: BloggerConfig): Promise<string> {
  const cfg = config || (await getBloggerConfig());

  if (cfg.accessToken && cfg.tokenExpiresAt && Date.now() < cfg.tokenExpiresAt - 60_000) {
    return cfg.accessToken;
  }

  if (!cfg.refreshToken || !cfg.clientId || !cfg.clientSecret) {
    throw new Error('Google Blogger OAuth baglantisi eksik. Lutfen once "Google ile Baglan" adimini tamamlayin.');
  }

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: cfg.refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Google erisim belirteci yenilenemedi.');
  }

  const expiresAt = Date.now() + Number(data.expires_in || 3500) * 1000;
  await saveBloggerConfig({
    accessToken: data.access_token,
    tokenExpiresAt: expiresAt,
  });

  return String(data.access_token);
}

export async function fetchUserBlogs(accessToken: string): Promise<BloggerAvailableBlog[]> {
  const res = await fetch(`${BLOGGER_API_BASE}/users/self/blogs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Blogger blog listesi alinamadi.');
  }
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map((b: any) => ({
    id: String(b.id),
    name: String(b.name || b.url || 'Blogger'),
    url: String(b.url || ''),
  }));
}

export async function fetchBlogByUrl(accessToken: string, url: string): Promise<BloggerAvailableBlog | null> {
  if (!url) return null;
  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
  const res = await fetch(
    `${BLOGGER_API_BASE}/blogs/byurl?url=${encodeURIComponent(cleanUrl)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const b = await res.json();
  if (!b?.id) return null;
  return {
    id: String(b.id),
    name: String(b.name || b.url || 'Blogger'),
    url: String(b.url || cleanUrl),
  };
}

function toAbsoluteUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/**
 * PEKEFE blog HTML'ini Google Blogger icin optimize eder:
 * - Goreli gorsel ve linkleri https://www.pekefe.com/... mutlak URL'lerine cevirir
 * - Kapak gorselini yazinin basina ekler
 * - Istege bagli olarak PEKEFE orijinal yazi kaynak linkini (SEO backlink) ekler
 */
export function formatContentForBlogger(
  post: {
    title: string;
    slug: string;
    content: string;
    image?: string | null;
    metaDesc?: string | null;
  },
  appendBacklink = true
): string {
  let html = String(post.content || '');

  // Convert relative src="/..." and href="/..." to absolute pekefe.com URLs
  html = html.replace(/(src|href)=(["'])\/(?!\/)/gi, `$1=$2${SITE_URL}/`);

  const parts: string[] = [];

  if (post.image) {
    const absImg = toAbsoluteUrl(post.image);
    const safeAlt = String(post.title || 'PEKEFE Blog').replace(/"/g, '&quot;');
    parts.push(
      `<div style="margin-bottom:20px;text-align:center;"><img src="${absImg}" alt="${safeAlt}" style="max-width:100%;height:auto;border-radius:12px;" /></div>`
    );
  }

  parts.push(html);

  if (appendBacklink && post.slug) {
    const originalUrl = `${SITE_URL}/blog/${post.slug}`;
    parts.push(
      `<hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />` +
        `<p style="font-size:13px;color:#6b7280;">Bu yazi <a href="${originalUrl}" target="_blank" rel="noopener"><strong>PEKEFE Blog</strong></a> uzerinde yayinlanmistir. Geleneksel Erzurum Ispir dut pekmezi, pestil ve cevizli kome cesitlerimizi kesfetmek icin <a href="${SITE_URL}" target="_blank" rel="noopener">www.pekefe.com</a> adresini ziyaret edebilirsiniz.</p>`
    );
  }

  return parts.join('\n');
}

export interface SyncPostInput {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string;
  image?: string | null;
  metaDesc?: string | null;
  isActive?: boolean;
}

export interface SyncPostResult {
  synced: boolean;
  skipped?: boolean;
  action?: 'created' | 'updated' | 'deleted';
  bloggerPostId?: string;
  bloggerUrl?: string;
  error?: string;
}

/**
 * Tek bir blog yazisini Google Blogger'a ekler veya mevcutsa gunceller.
 * force=true ise autoSync kapali olsa bile manuel senkronizasyon yapar.
 */
export async function syncPostToBlogger(
  post: SyncPostInput,
  options: { force?: boolean } = {}
): Promise<SyncPostResult> {
  const config = await getBloggerConfig();

  if (!config.refreshToken || !config.blogId) {
    return { synced: false, skipped: true, error: 'Google Blogger bagli degil.' };
  }

  if (!options.force && (!config.enabled || !config.autoSync)) {
    return { synced: false, skipped: true };
  }

  try {
    const accessToken = await getValidAccessToken(config);
    const existing = config.postMap?.[post.id];
    const isDraft = post.isActive === false;
    const labels = Array.from(
      new Set([post.category || 'Genel', 'PEKEFE', 'İspir Yöresel Ürünler'].filter(Boolean))
    );
    const formattedContent = formatContentForBlogger(post, config.appendBacklink);

    const payload: Record<string, any> = {
      kind: 'blogger#post',
      blog: { id: config.blogId },
      title: post.title,
      content: formattedContent,
      labels,
    };

    let data: any = null;
    let action: 'created' | 'updated' = 'created';

    if (existing?.bloggerPostId) {
      // Update existing Blogger post
      payload.id = existing.bloggerPostId;
      const putRes = await fetch(
        `${BLOGGER_API_BASE}/blogs/${encodeURIComponent(config.blogId)}/posts/${encodeURIComponent(existing.bloggerPostId)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (putRes.status === 404) {
        // Post was deleted on Blogger side; recreate it
        delete payload.id;
        const postUrl = `${BLOGGER_API_BASE}/blogs/${encodeURIComponent(config.blogId)}/posts/${isDraft ? '?isDraft=true' : ''}`;
        const createRes = await fetch(postUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        data = await createRes.json();
        if (!createRes.ok) {
          throw new Error(data?.error?.message || 'Blogger yazisi yeniden olusturulamadi.');
        }
        action = 'created';
      } else {
        data = await putRes.json();
        if (!putRes.ok) {
          throw new Error(data?.error?.message || 'Blogger yazisi guncellenemedi.');
        }
        action = 'updated';

        // Handle draft <-> published status transitions
        if (existing.isDraft && !isDraft) {
          await fetch(
            `${BLOGGER_API_BASE}/blogs/${encodeURIComponent(config.blogId)}/posts/${encodeURIComponent(existing.bloggerPostId)}/publish`,
            { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
          ).catch(() => {});
        } else if (existing.isDraft === false && isDraft) {
          await fetch(
            `${BLOGGER_API_BASE}/blogs/${encodeURIComponent(config.blogId)}/posts/${encodeURIComponent(existing.bloggerPostId)}/revert`,
            { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
          ).catch(() => {});
        }
      }
    } else {
      // Create new Blogger post
      const postUrl = `${BLOGGER_API_BASE}/blogs/${encodeURIComponent(config.blogId)}/posts/${isDraft ? '?isDraft=true' : ''}`;
      const createRes = await fetch(postUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      data = await createRes.json();
      if (!createRes.ok) {
        throw new Error(data?.error?.message || 'Blogger yazisi olusturulamadi.');
      }
      action = 'created';
    }

    const nowIso = new Date().toISOString();
    const bloggerPostId = String(data.id || existing?.bloggerPostId || '');
    const bloggerUrl = String(data.url || existing?.bloggerUrl || '');

    const latestConfig = await getBloggerConfig();
    const updatedMap = {
      ...(latestConfig.postMap || {}),
      [post.id]: {
        bloggerPostId,
        bloggerUrl,
        syncedAt: nowIso,
        lastError: null,
        isDraft,
      },
    };

    await saveBloggerConfig({
      lastSync: nowIso,
      postMap: updatedMap,
    });

    return {
      synced: true,
      action,
      bloggerPostId,
      bloggerUrl,
    };
  } catch (err: any) {
    const message = err?.message || 'Blogger senkronizasyon hatasi';
    console.error('[BLOGGER SYNC ERROR]', message);

    try {
      const latestConfig = await getBloggerConfig();
      const prev = latestConfig.postMap?.[post.id];
      if (prev) {
        await saveBloggerConfig({
          postMap: {
            ...latestConfig.postMap,
            [post.id]: { ...prev, lastError: message },
          },
        });
      }
    } catch {}

    return { synced: false, error: message };
  }
}

/**
 * Silinen blog yazisini (syncDelete aciksa) Google Blogger'dan da siler.
 */
export async function deletePostFromBlogger(localPostId: string): Promise<SyncPostResult> {
  const config = await getBloggerConfig();
  const mapping = config.postMap?.[localPostId];

  if (!mapping?.bloggerPostId) {
    return { synced: false, skipped: true };
  }

  if (!config.enabled || !config.syncDelete || !config.refreshToken || !config.blogId) {
    return { synced: false, skipped: true };
  }

  try {
    const accessToken = await getValidAccessToken(config);
    const res = await fetch(
      `${BLOGGER_API_BASE}/blogs/${encodeURIComponent(config.blogId)}/posts/${encodeURIComponent(mapping.bloggerPostId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok && res.status !== 404 && res.status !== 204) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'Blogger yazisi silinemedi.');
    }

    const latestConfig = await getBloggerConfig();
    const nextMap = { ...(latestConfig.postMap || {}) };
    delete nextMap[localPostId];
    await saveBloggerConfig({
      lastSync: new Date().toISOString(),
      postMap: nextMap,
    });

    return { synced: true, action: 'deleted', bloggerPostId: mapping.bloggerPostId };
  } catch (err: any) {
    console.error('[BLOGGER DELETE ERROR]', err?.message);
    return { synced: false, error: err?.message || 'Blogger silme hatasi' };
  }
}
