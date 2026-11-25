import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { getPublishedProductsServer } from '@/lib/category-server';
import {
  generateSocialPackForProduct,
  getSocialMediaConfig,
  publishSocialPack,
  saveSocialMediaConfig,
} from '@/lib/social-media-engine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/social-media
 * Ayarlar (tokenlar maskeli), uretilmis 5-platform icerik paketleri ve canli urun listesini doner.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const [config, products] = await Promise.all([
      getSocialMediaConfig(),
      getPublishedProductsServer().catch(() => []),
    ]);

    return NextResponse.json({
      settings: {
        enabled: config.enabled,
        autoGenerateOnNewProduct: config.autoGenerateOnNewProduct,
        autoPublishOnNewProduct: config.autoPublishOnNewProduct,
        instagram: {
          enabled: config.instagram.enabled,
          accountId: config.instagram.accountId,
          hasAccessToken: Boolean(config.instagram.accessToken),
          publishPost: config.instagram.publishPost,
          publishStory: config.instagram.publishStory,
        },
        facebook: {
          enabled: config.facebook.enabled,
          pageId: config.facebook.pageId,
          hasPageAccessToken: Boolean(config.facebook.pageAccessToken),
        },
        whatsapp: {
          enabled: config.whatsapp.enabled,
          broadcastPhones: config.whatsapp.broadcastPhones,
        },
        youtube: {
          enabled: config.youtube.enabled,
          channelHandle: config.youtube.channelHandle,
          webhookUrl: config.youtube.webhookUrl,
        },
        googleBusiness: {
          enabled: config.googleBusiness.enabled,
          locationName: config.googleBusiness.locationName,
          webhookUrl: config.googleBusiness.webhookUrl,
        },
        universalWebhookUrl: config.universalWebhookUrl,
      },
      packs: config.packs || [],
      products: (products || []).map((p: any) => ({
        id: String(p.id),
        name: String(p.name || ''),
        slug: String(p.slug || p.id),
        category: String(p.category || ''),
        price: Number(p.price || 0),
        image: p.image || '/pekefe-dut-pekmezi-kavanoz-tr.jpg',
        shortDesc: p.shortDesc || '',
        desc: p.desc || '',
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Sosyal medya verileri alınamadı.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/social-media
 * Actions: save-settings | generate | publish | delete-pack
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'save-settings';

    if (action === 'generate') {
      const products = await getPublishedProductsServer().catch(() => []);
      const target = products.find(
        (p: any) => String(p.id) === String(body.productId) || String(p.slug) === String(body.productId)
      );
      if (!target) {
        return NextResponse.json({ error: 'Ürün bulunamadı.' }, { status: 404 });
      }
      const pack = await generateSocialPackForProduct(target);
      return NextResponse.json({ success: true, pack });
    }

    if (action === 'publish') {
      if (!body.packId) {
        return NextResponse.json({ error: 'İçerik paketi ID zorunludur.' }, { status: 400 });
      }
      const out = await publishSocialPack(String(body.packId), body.target || 'all');
      return NextResponse.json({ success: true, ...out });
    }

    if (action === 'delete-pack') {
      const current = await getSocialMediaConfig();
      const filtered = current.packs.filter((p) => p.id !== String(body.packId));
      await saveSocialMediaConfig({ packs: filtered });
      return NextResponse.json({ success: true });
    }

    // Default: save-settings
    const current = await getSocialMediaConfig();
    const patch: any = {};
    if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
    if (typeof body.autoGenerateOnNewProduct === 'boolean') {
      patch.autoGenerateOnNewProduct = body.autoGenerateOnNewProduct;
    }
    if (typeof body.autoPublishOnNewProduct === 'boolean') {
      patch.autoPublishOnNewProduct = body.autoPublishOnNewProduct;
    }
    if (typeof body.universalWebhookUrl === 'string') {
      patch.universalWebhookUrl = body.universalWebhookUrl.trim();
    }

    if (body.instagram && typeof body.instagram === 'object') {
      patch.instagram = {
        ...current.instagram,
        enabled: body.instagram.enabled ?? current.instagram.enabled,
        accountId: typeof body.instagram.accountId === 'string' ? body.instagram.accountId.trim() : current.instagram.accountId,
        publishPost: body.instagram.publishPost ?? current.instagram.publishPost,
        publishStory: body.instagram.publishStory ?? current.instagram.publishStory,
        ...(body.instagram.accessToken && String(body.instagram.accessToken).trim()
          ? { accessToken: String(body.instagram.accessToken).trim() }
          : {}),
      };
    }

    if (body.facebook && typeof body.facebook === 'object') {
      patch.facebook = {
        ...current.facebook,
        enabled: body.facebook.enabled ?? current.facebook.enabled,
        pageId: typeof body.facebook.pageId === 'string' ? body.facebook.pageId.trim() : current.facebook.pageId,
        ...(body.facebook.pageAccessToken && String(body.facebook.pageAccessToken).trim()
          ? { pageAccessToken: String(body.facebook.pageAccessToken).trim() }
          : {}),
      };
    }

    if (body.whatsapp && typeof body.whatsapp === 'object') {
      patch.whatsapp = {
        ...current.whatsapp,
        enabled: body.whatsapp.enabled ?? current.whatsapp.enabled,
        broadcastPhones:
          typeof body.whatsapp.broadcastPhones === 'string'
            ? body.whatsapp.broadcastPhones.trim()
            : current.whatsapp.broadcastPhones,
      };
    }

    if (body.youtube && typeof body.youtube === 'object') {
      patch.youtube = {
        ...current.youtube,
        enabled: body.youtube.enabled ?? current.youtube.enabled,
        channelHandle:
          typeof body.youtube.channelHandle === 'string'
            ? body.youtube.channelHandle.trim()
            : current.youtube.channelHandle,
        webhookUrl:
          typeof body.youtube.webhookUrl === 'string'
            ? body.youtube.webhookUrl.trim()
            : current.youtube.webhookUrl,
      };
    }

    if (body.googleBusiness && typeof body.googleBusiness === 'object') {
      patch.googleBusiness = {
        ...current.googleBusiness,
        enabled: body.googleBusiness.enabled ?? current.googleBusiness.enabled,
        locationName:
          typeof body.googleBusiness.locationName === 'string'
            ? body.googleBusiness.locationName.trim()
            : current.googleBusiness.locationName,
        webhookUrl:
          typeof body.googleBusiness.webhookUrl === 'string'
            ? body.googleBusiness.webhookUrl.trim()
            : current.googleBusiness.webhookUrl,
      };
    }

    await saveSocialMediaConfig(patch);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'İşlem sırasında hata oluştu.' },
      { status: 500 }
    );
  }
}
