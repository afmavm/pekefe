import { prisma, withTimeout } from '@/lib/prisma';
import { WhatsAppNotificationService } from '@/lib/whatsapp-service';
import { slugifyTr } from '@/lib/category-utils';
import fs from 'fs';
import path from 'path';

const INTEGRATION_ID = 'pekefe-social-media-engine';
const LOCAL_STORE_PATH = path.join(process.cwd(), 'data', 'social_media_engine.json');
const SITE_URL = 'https://www.pekefe.com';
const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

export interface SocialProductInput {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  price?: number;
  image?: string;
  desc?: string;
  shortDesc?: string;
}

export interface GeneratedSocialPack {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productUrl: string;
  productImage: string;
  productPrice: number;
  productCategory: string;
  generatedBy: 'gemini' | 'template';
  createdAt: string;
  instagram: {
    post: {
      hook: string;
      caption: string;
      hashtags: string[];
      cta: string;
    };
    story: {
      slides: Array<{
        slideNo: number;
        type: 'hook' | 'benefit' | 'cta';
        headline: string;
        body: string;
        stickerSuggestion: string;
      }>;
    };
    reels: {
      hook0_3s: string;
      body3_15s: string;
      cta15_25s: string;
      visualDirection: string;
      caption: string;
      hashtags: string[];
    };
  };
  facebook: {
    hook: string;
    postText: string;
    questionForEngagement: string;
    hashtags: string[];
    linkUrl: string;
  };
  whatsapp: {
    broadcastText: string;
    statusCaption: string;
    waShareUrl: string;
  };
  youtube: {
    shortsTitle: string;
    seoDescription: string;
    script0_30s: string;
    tags: string[];
  };
  googleBusiness: {
    summary: string;
    ctaType: 'ORDER' | 'LEARN_MORE' | 'SHOP';
    ctaUrl: string;
    localKeywords: string[];
  };
  publishStatus: {
    instagramPost?: { status: 'published' | 'failed' | 'pending'; externalId?: string; message?: string; at?: string };
    instagramStory?: { status: 'published' | 'failed' | 'pending'; externalId?: string; message?: string; at?: string };
    facebookPost?: { status: 'published' | 'failed' | 'pending'; externalId?: string; message?: string; at?: string };
    whatsapp?: { status: 'published' | 'failed' | 'pending'; message?: string; at?: string };
    youtube?: { status: 'published' | 'failed' | 'pending'; message?: string; at?: string };
    googleBusiness?: { status: 'published' | 'failed' | 'pending'; message?: string; at?: string };
  };
}

export interface SocialMediaConfig {
  enabled: boolean;
  autoGenerateOnNewProduct: boolean;
  autoPublishOnNewProduct: boolean;
  instagram: {
    enabled: boolean;
    accountId: string;
    accessToken: string;
    publishPost: boolean;
    publishStory: boolean;
  };
  facebook: {
    enabled: boolean;
    pageId: string;
    pageAccessToken: string;
  };
  whatsapp: {
    enabled: boolean;
    broadcastPhones: string; // comma separated phones for auto broadcast
  };
  youtube: {
    enabled: boolean;
    channelHandle: string;
    webhookUrl: string;
  };
  googleBusiness: {
    enabled: boolean;
    locationName: string;
    webhookUrl: string;
  };
  universalWebhookUrl: string; // Optional Make.com / n8n / Zapier webhook receiving full 5-platform JSON
  packs: GeneratedSocialPack[];
}

function createDefaultSocialConfig(): SocialMediaConfig {
  return {
    enabled: true,
    autoGenerateOnNewProduct: true,
    autoPublishOnNewProduct: true,
    instagram: {
      enabled: true,
      accountId: '',
      accessToken: '',
      publishPost: true,
      publishStory: true,
    },
    facebook: {
      enabled: true,
      pageId: '',
      pageAccessToken: '',
    },
    whatsapp: {
      enabled: true,
      broadcastPhones: '',
    },
    youtube: {
      enabled: true,
      channelHandle: '@pekefe',
      webhookUrl: '',
    },
    googleBusiness: {
      enabled: true,
      locationName: 'PEKEFE İspir Yöresel Ürünler',
      webhookUrl: '',
    },
    universalWebhookUrl: '',
    packs: [],
  };
}

function readLocalStore(): Partial<SocialMediaConfig> | null {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf-8'));
    }
  } catch {}
  return null;
}

function writeLocalStore(cfg: SocialMediaConfig): void {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[SOCIAL] Local store write error:', err);
  }
}

async function persistSocialConfig(next: SocialMediaConfig): Promise<void> {
  writeLocalStore(next);
  try {
    await withTimeout(
      prisma.integration.upsert({
        where: { id: INTEGRATION_ID },
        update: {
          status: next.enabled ? 'active' : 'paused',
          lastSync: new Date().toISOString(),
          settings: next as any,
        },
        create: {
          id: INTEGRATION_ID,
          name: 'PEKEFE Social Media Automation',
          type: 'social',
          status: next.enabled ? 'active' : 'paused',
          lastSync: new Date().toISOString(),
          logo: 'social',
          settings: next as any,
        },
      }),
      2000,
      null
    );
  } catch (err) {
    console.warn('[SOCIAL] DB save warning:', err);
  }
}

export async function getSocialMediaConfig(): Promise<SocialMediaConfig> {
  const defaults = createDefaultSocialConfig();
  let dbData: Partial<SocialMediaConfig> | null = null;

  try {
    const row = await withTimeout(
      prisma.integration.findUnique({ where: { id: INTEGRATION_ID } }),
      1500,
      null
    );
    if (row?.settings && typeof row.settings === 'object') {
      dbData = row.settings as Partial<SocialMediaConfig>;
    }
  } catch {}

  const localData = readLocalStore();
  return {
    ...defaults,
    ...(localData || {}),
    ...(dbData || {}),
    instagram: { ...defaults.instagram, ...(localData?.instagram || {}), ...(dbData?.instagram || {}) },
    facebook: { ...defaults.facebook, ...(localData?.facebook || {}), ...(dbData?.facebook || {}) },
    whatsapp: { ...defaults.whatsapp, ...(localData?.whatsapp || {}), ...(dbData?.whatsapp || {}) },
    youtube: { ...defaults.youtube, ...(localData?.youtube || {}), ...(dbData?.youtube || {}) },
    googleBusiness: {
      ...defaults.googleBusiness,
      ...(localData?.googleBusiness || {}),
      ...(dbData?.googleBusiness || {}),
    },
    packs: Array.isArray(dbData?.packs)
      ? dbData!.packs
      : Array.isArray(localData?.packs)
        ? localData!.packs
        : [],
  };
}

export async function saveSocialMediaConfig(
  patch: Partial<SocialMediaConfig>
): Promise<SocialMediaConfig> {
  const current = await getSocialMediaConfig();
  const next: SocialMediaConfig = {
    ...current,
    ...patch,
    instagram: patch.instagram ? { ...current.instagram, ...patch.instagram } : current.instagram,
    facebook: patch.facebook ? { ...current.facebook, ...patch.facebook } : current.facebook,
    whatsapp: patch.whatsapp ? { ...current.whatsapp, ...patch.whatsapp } : current.whatsapp,
    youtube: patch.youtube ? { ...current.youtube, ...patch.youtube } : current.youtube,
    googleBusiness: patch.googleBusiness
      ? { ...current.googleBusiness, ...patch.googleBusiness }
      : current.googleBusiness,
    packs: (patch.packs ?? current.packs).slice(0, 50),
  };
  await persistSocialConfig(next);
  return next;
}

function stripHtml(str = ''): string {
  return String(str || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toAbsoluteUrl(url?: string): string {
  if (!url) return `${SITE_URL}/pekefe-dut-pekmezi-kavanoz-tr.jpg`;
  const trimmed = String(url).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

function buildTemplatePack(product: SocialProductInput): Omit<GeneratedSocialPack, 'id' | 'createdAt' | 'publishStatus'> {
  const slug = product.slug || slugifyTr(product.name || product.id);
  const productUrl = `${SITE_URL}/urun/${slug}`;
  const productImage = toAbsoluteUrl(product.image);
  const price = Number(product.price || 0);
  const priceText = price > 0 ? `₺${price.toLocaleString('tr-TR')}` : 'Taze Mahsul';
  const category = product.category || 'İspir Yöresel Ürünler';
  const cleanSummary = stripHtml(product.shortDesc || product.desc || '').slice(0, 220) ||
    `Erzurum İspir yaylalarından geleneksel yöntemlerle, ilave şekersiz ve katkısız hazırlanan ${product.name}.`;

  const baseHashtags = [
    '#pekefe',
    '#ispir',
    '#erzurum',
    '#yoreselurunler',
    '#dogallezzet',
    '#katkisiz',
    '#dutpekmezi',
    '#pestil',
    '#kome',
    '#dogalbeslenme',
    '#anadolumutfagi',
    '#gunpekmezi',
  ];

  const igPostHook = `🛑 Market raflarındaki glikozlu ürünleri unutun: ${product.name} İspir'den sofranıza geldi!`;
  const igPostCaption = [
    igPostHook,
    '',
    `✨ ${cleanSummary}`,
    '',
    `✅ %100 Katkısız & İlave Şekersiz`,
    `☀️ İspir'in temiz dağ güneşiyle geleneksel üretim`,
    `📦 Güvenli ambalaj & Türkiye'nin her yerine hızlı kargo`,
    price > 0 ? `💰 Fiyat: ${priceText}` : '',
    '',
    `👇 Siz bu lezzeti sade mi yoksa çay/kahve yanında mı tercih edersiniz? Yorumlara yazın!`,
    `🛒 Hemen sipariş: ${productUrl}`,
  ]
    .filter((l) => l !== '')
    .join('\n');

  const waBroadcast = [
    `🌿 *YENİ TAZE MAHSUL: ${product.name}*`,
    '',
    cleanSummary,
    '',
    price > 0 ? `💰 *Fiyat:* ${priceText}` : '',
    `✅ %100 Doğal • Katkısız • Erzurum İspir Üretimi`,
    `🛒 Hemen İncele & Sipariş Ver:\n${productUrl}`,
    `_PEKEFE İspir Yöresel Ürünler_`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    productId: String(product.id),
    productName: product.name,
    productSlug: slug,
    productUrl,
    productImage,
    productPrice: price,
    productCategory: category,
    generatedBy: 'template',
    instagram: {
      post: {
        hook: igPostHook,
        caption: igPostCaption,
        hashtags: baseHashtags,
        cta: `Profildeki linkten veya www.pekefe.com üzerinden hemen sipariş verin!`,
      },
      story: {
        slides: [
          {
            slideNo: 1,
            type: 'hook',
            headline: `Gerçek İspir lezzetini denediniz mi? 👀`,
            body: `${product.name} taze üretimle stoklarımızda!`,
            stickerSuggestion: 'Anket Çıkartması: "Bayılırım 😍" / "İlk kez deneyeceğim 🤩"',
          },
          {
            slideNo: 2,
            type: 'benefit',
            headline: `Neden PEKEFE ${product.name}?`,
            body: `• Sıfır ilave şeker & glikoz\n• İspir dağ güneşinde doğal kurutma/yoğunlaştırma\n• Koruyucu & renklendirici içermez`,
            stickerSuggestion: 'Emoji Kaydırıcı (🔥)',
          },
          {
            slideNo: 3,
            type: 'cta',
            headline: `Sofranıza gelsin! ${priceText}`,
            body: `Aşağıdaki bağlantıya tıklayıp güvenle sipariş oluşturun.`,
            stickerSuggestion: `Bağlantı Çıkartması → ${productUrl}`,
          },
        ],
      },
      reels: {
        hook0_3s: `"Bu gördüğünüz ${product.name} neden diğerlerinden tamamen farklı?" (Yakın plan doku / parlaklık çekimi)`,
        body3_15s: `Erzurum İspir'in yüksek yaylalarından toplanan doğal dutlarla, glikoz şurubu ve koruyucu eklemeden geleneksel yöntemlerle hazırlanıyor. ${cleanSummary.slice(0, 110)}`,
        cta15_25s: `Gerçek İspir lezzetini sofranıza taşımak için profildeki linke tıklayın veya pekefe.com'u ziyaret edin!`,
        visualDirection: '0-3sn: Yakın plan ürün dokusu / kesit · 3-10sn: Kavanoz/paket açılışı ve servis anı · 10-20sn: Çay/tahin eşliğinde sunum + PEKEFE logosu.',
        caption: `🔥 ${product.name} ile gerçek İspir lezzetini keşfedin!\n\n${cleanSummary}\n\n🛒 Sipariş: ${productUrl}`,
        hashtags: [...baseHashtags.slice(0, 8), '#reels', '#keşfet', '#yoreseltatlar'],
      },
    },
    facebook: {
      hook: `Erzurum İspir yaylalarından sofranıza: ${product.name} artık stoklarımızda! 🌿`,
      postText: [
        `Erzurum İspir yaylalarından sofranıza: ${product.name} artık stoklarımızda! 🌿`,
        '',
        cleanSummary,
        '',
        `2014'ten bu yana geleneksel üretim kültürümüze sadık kalarak; ilave şeker, glikoz şurubu ve koruyucu kullanmadan hazırlıyoruz.`,
        price > 0 ? `Güncel Fiyat: ${priceText}` : '',
        '',
        `Detaylı incelemek ve güvenle sipariş vermek için:`,
        productUrl,
      ]
        .filter((l) => l !== '')
        .join('\n'),
      questionForEngagement: `Sizin memleketinizde bu lezzet en çok neyle birlikte tüketilir? Yorumlarda buluşalım 👇`,
      hashtags: ['#PEKEFE', '#İspir', '#ErzurumYöresel', '#DoğalÜrünler', '#Katkısız'],
      linkUrl: productUrl,
    },
    whatsapp: {
      broadcastText: waBroadcast,
      statusCaption: `🌿 Taze Mahsul: ${product.name} (${priceText}) • %100 Doğal İspir Üretimi 👉 ${productUrl}`,
      waShareUrl: `https://wa.me/?text=${encodeURIComponent(waBroadcast)}`,
    },
    youtube: {
      shortsTitle: `${product.name} | %100 Doğal İspir Üretimi #shorts`.slice(0, 95),
      seoDescription: `${product.name} nedir, nasıl üretilir ve neden katkısızdır?\n\n${cleanSummary}\n\n🛒 Güvenle Sipariş Ver: ${productUrl}\n🌐 Tüm İspir Yöresel Ürünlerimiz: ${SITE_URL}\n\n#pekefe #ispir #dutpekmezi #pestil #kome #yoreselurunler #shorts`,
      script0_30s: `[0-3sn KANCA] Gerçek ${product.name} nasıl anlaşılır?\n[3-18sn GÖVDE] Erzurum İspir'in temiz dağ havasında, sıfır ilave şeker ve glikoz olmadan geleneksel yöntemle hazırlanan PEKEFE ${product.name}, doğal aromasını ve besin değerini korur.\n[18-30sn CTA] Açıklamadaki linkten hemen inceleyip sipariş verebilirsiniz. Kanalımıza abone olmayı unutmayın!`,
      tags: ['pekefe', 'ispir', 'erzurum yöresel ürünler', product.name.toLowerCase(), 'dut pekmezi', 'dut pestili', 'cevizli köme', 'doğal gıda', 'katkısız'],
    },
    googleBusiness: {
      summary: `Erzurum İspir'den taze üretim ${product.name} şimdi PEKEFE'de! ${cleanSummary} İlave şeker, glikoz ve koruyucu içermez. ${price > 0 ? `Fiyat: ${priceText}. ` : ''}Türkiye'nin her yerine özenli ambalaj ve hızlı kargo ile kapınızda.`,
      ctaType: 'ORDER',
      ctaUrl: productUrl,
      localKeywords: ['Erzurum İspir yöresel ürünler', product.name, 'PEKEFE', 'katkısız dut pekmezi', 'İspir pestil köme'],
    },
  };
}

/**
 * Gemini AI ile 5 platform (Instagram Post/Story/Reels, Facebook, WhatsApp, YouTube Shorts, Google Business)
 * icin kanca yontemli, SEO uyumlu, etkileşim odakli icerik paketi uretir.
 */
export async function generateSocialPackForProduct(
  product: SocialProductInput
): Promise<GeneratedSocialPack> {
  const fallback = buildTemplatePack(product);
  const apiKey = process.env.GEMINI_API_KEY || '';

  let finalCore = fallback;

  if (apiKey) {
    try {
      const prompt = `Sen Türkiye'nin en iyi D2C e-ticaret sosyal medya ve SEO stratejistisin.
Marka: PEKEFE İspir Yöresel Ürünler (Erzurum İspir, 2014'ten beri %100 doğal, ilave şekersiz, glikozsuz, güneşte olgunlaşan dut pekmezi, yaprak pestil, cevizli köme).
Ürün Adı: ${product.name}
Kategori: ${fallback.productCategory}
Fiyat: ${fallback.productPrice > 0 ? `${fallback.productPrice} TL` : 'Belirtilmedi'}
Ürün URL: ${fallback.productUrl}
Açıklama: ${stripHtml(product.shortDesc || product.desc || '').slice(0, 450)}

Bu ürün için 5 platforma özel, HER PLATFORMUN KENDİ KURALLARINA VE SEO YAPISINA UYGUN, ETKİLİ KANCA (HOOK) YÖNTEMLİ Türkçe içerik paketi üret.
Sadece geçerli JSON döndür (markdown kod bloğu kullanma), şema:
{
  "instagram": {
    "post": { "hook": "...", "caption": "...", "hashtags": ["#..."], "cta": "..." },
    "story": { "slides": [
      { "slideNo": 1, "type": "hook", "headline": "...", "body": "...", "stickerSuggestion": "..." },
      { "slideNo": 2, "type": "benefit", "headline": "...", "body": "...", "stickerSuggestion": "..." },
      { "slideNo": 3, "type": "cta", "headline": "...", "body": "...", "stickerSuggestion": "..." }
    ]},
    "reels": { "hook0_3s": "...", "body3_15s": "...", "cta15_25s": "...", "visualDirection": "...", "caption": "...", "hashtags": ["#..."] }
  },
  "facebook": { "hook": "...", "postText": "...", "questionForEngagement": "...", "hashtags": ["#..."], "linkUrl": "${fallback.productUrl}" },
  "whatsapp": { "broadcastText": "...", "statusCaption": "..." },
  "youtube": { "shortsTitle": "...", "seoDescription": "...", "script0_30s": "...", "tags": ["..."] },
  "googleBusiness": { "summary": "...", "ctaType": "ORDER", "ctaUrl": "${fallback.productUrl}", "localKeywords": ["..."] }
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.75,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed?.instagram?.post && parsed?.facebook && parsed?.youtube && parsed?.googleBusiness) {
          finalCore = {
            ...fallback,
            generatedBy: 'gemini',
            instagram: {
              post: { ...fallback.instagram.post, ...parsed.instagram.post },
              story: parsed.instagram.story?.slides?.length ? parsed.instagram.story : fallback.instagram.story,
              reels: { ...fallback.instagram.reels, ...parsed.instagram.reels },
            },
            facebook: { ...fallback.facebook, ...parsed.facebook, linkUrl: fallback.productUrl },
            whatsapp: {
              broadcastText: parsed.whatsapp?.broadcastText || fallback.whatsapp.broadcastText,
              statusCaption: parsed.whatsapp?.statusCaption || fallback.whatsapp.statusCaption,
              waShareUrl: `https://wa.me/?text=${encodeURIComponent(parsed.whatsapp?.broadcastText || fallback.whatsapp.broadcastText)}`,
            },
            youtube: { ...fallback.youtube, ...parsed.youtube },
            googleBusiness: { ...fallback.googleBusiness, ...parsed.googleBusiness, ctaUrl: fallback.productUrl },
          };
        }
      }
    } catch (aiErr) {
      console.warn('[SOCIAL AI] Gemini fallback to template:', aiErr);
    }
  }

  const pack: GeneratedSocialPack = {
    ...finalCore,
    id: `soc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    publishStatus: {},
  };

  const config = await getSocialMediaConfig();
  const nextPacks = [pack, ...config.packs.filter((p) => p.productId !== pack.productId)].slice(0, 50);
  await saveSocialMediaConfig({ packs: nextPacks });

  return pack;
}

/**
 * Bir icerik paketini secili platforma (veya 'all' ile bagli tum platformlara) otomatik yayinlar.
 */
export async function publishSocialPack(
  packId: string,
  target: 'all' | 'instagramPost' | 'instagramStory' | 'facebookPost' | 'whatsapp' | 'youtube' | 'googleBusiness' = 'all'
): Promise<{ pack: GeneratedSocialPack; results: Record<string, any> }> {
  const config = await getSocialMediaConfig();
  const idx = config.packs.findIndex((p) => p.id === packId);
  if (idx < 0) throw new Error('İçerik paketi bulunamadı.');

  const pack = { ...config.packs[idx], publishStatus: { ...(config.packs[idx].publishStatus || {}) } };
  const results: Record<string, any> = {};
  const nowIso = new Date().toISOString();

  // 1. Instagram Post (Meta Graph API v21)
  if ((target === 'all' || target === 'instagramPost') && config.instagram.enabled && config.instagram.publishPost) {
    if (config.instagram.accountId && config.instagram.accessToken) {
      try {
        const caption = `${pack.instagram.post.caption}\n\n${pack.instagram.post.hashtags.join(' ')}`;
        const createRes = await fetch(
          `${GRAPH_API_BASE}/${encodeURIComponent(config.instagram.accountId)}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: pack.productImage,
              caption,
              access_token: config.instagram.accessToken,
            }),
          }
        );
        const createData = await createRes.json();
        if (!createRes.ok || !createData.id) {
          throw new Error(createData?.error?.message || 'Instagram medya konteyneri oluşturulamadı.');
        }

        const pubRes = await fetch(
          `${GRAPH_API_BASE}/${encodeURIComponent(config.instagram.accountId)}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: createData.id,
              access_token: config.instagram.accessToken,
            }),
          }
        );
        const pubData = await pubRes.json();
        if (!pubRes.ok || !pubData.id) {
          throw new Error(pubData?.error?.message || 'Instagram gönderisi yayınlanamadı.');
        }

        pack.publishStatus.instagramPost = {
          status: 'published',
          externalId: String(pubData.id),
          message: 'Instagram Post olarak yayınlandı.',
          at: nowIso,
        };
        results.instagramPost = { ok: true, id: pubData.id };
      } catch (err: any) {
        pack.publishStatus.instagramPost = { status: 'failed', message: err?.message, at: nowIso };
        results.instagramPost = { ok: false, error: err?.message };
      }
    } else if (target === 'instagramPost') {
      results.instagramPost = { ok: false, error: 'Instagram Business Account ID ve Access Token eksik.' };
    }
  }

  // 2. Instagram Story (Meta Graph API v21)
  if ((target === 'all' || target === 'instagramStory') && config.instagram.enabled && config.instagram.publishStory) {
    if (config.instagram.accountId && config.instagram.accessToken) {
      try {
        const createRes = await fetch(
          `${GRAPH_API_BASE}/${encodeURIComponent(config.instagram.accountId)}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              media_type: 'STORIES',
              image_url: pack.productImage,
              access_token: config.instagram.accessToken,
            }),
          }
        );
        const createData = await createRes.json();
        if (!createRes.ok || !createData.id) {
          throw new Error(createData?.error?.message || 'Instagram Hikaye oluşturulamadı.');
        }

        const pubRes = await fetch(
          `${GRAPH_API_BASE}/${encodeURIComponent(config.instagram.accountId)}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: createData.id,
              access_token: config.instagram.accessToken,
            }),
          }
        );
        const pubData = await pubRes.json();
        if (!pubRes.ok || !pubData.id) {
          throw new Error(pubData?.error?.message || 'Instagram Hikaye yayınlanamadı.');
        }

        pack.publishStatus.instagramStory = {
          status: 'published',
          externalId: String(pubData.id),
          message: 'Instagram Hikaye olarak yayınlandı.',
          at: nowIso,
        };
        results.instagramStory = { ok: true, id: pubData.id };
      } catch (err: any) {
        pack.publishStatus.instagramStory = { status: 'failed', message: err?.message, at: nowIso };
        results.instagramStory = { ok: false, error: err?.message };
      }
    } else if (target === 'instagramStory') {
      results.instagramStory = { ok: false, error: 'Instagram Business Account ID ve Access Token eksik.' };
    }
  }

  // 3. Facebook Page Post (Meta Graph API v21)
  if ((target === 'all' || target === 'facebookPost') && config.facebook.enabled) {
    if (config.facebook.pageId && config.facebook.pageAccessToken) {
      try {
        const message = `${pack.facebook.postText}\n\n${pack.facebook.questionForEngagement}\n\n${pack.facebook.hashtags.join(' ')}`;
        const fbRes = await fetch(
          `${GRAPH_API_BASE}/${encodeURIComponent(config.facebook.pageId)}/photos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: pack.productImage,
              caption: message,
              access_token: config.facebook.pageAccessToken,
            }),
          }
        );
        const fbData = await fbRes.json();
        if (!fbRes.ok || (!fbData.id && !fbData.post_id)) {
          throw new Error(fbData?.error?.message || 'Facebook gönderisi yayınlanamadı.');
        }

        pack.publishStatus.facebookPost = {
          status: 'published',
          externalId: String(fbData.post_id || fbData.id),
          message: 'Facebook Sayfasında yayınlandı.',
          at: nowIso,
        };
        results.facebookPost = { ok: true, id: fbData.post_id || fbData.id };
      } catch (err: any) {
        pack.publishStatus.facebookPost = { status: 'failed', message: err?.message, at: nowIso };
        results.facebookPost = { ok: false, error: err?.message };
      }
    } else if (target === 'facebookPost') {
      results.facebookPost = { ok: false, error: 'Facebook Page ID ve Page Access Token eksik.' };
    }
  }

  // 4. WhatsApp Broadcast (Twilio / Meta Cloud API)
  if ((target === 'all' || target === 'whatsapp') && config.whatsapp.enabled) {
    const phones = String(config.whatsapp.broadcastPhones || '')
      .split(/[\s,;]+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 10);

    if (phones.length > 0) {
      let sentCount = 0;
      for (const phone of phones.slice(0, 20)) {
        const waRes = await WhatsAppNotificationService.sendWhatsApp(phone, pack.whatsapp.broadcastText);
        if (waRes.success && waRes.provider !== 'deep-link' && waRes.provider !== 'none') {
          sentCount++;
        }
      }
      pack.publishStatus.whatsapp = {
        status: sentCount > 0 ? 'published' : 'pending',
        message:
          sentCount > 0
            ? `${sentCount}/${phones.length} numaraya WhatsApp duyurusu gönderildi.`
            : 'WhatsApp API bağlı değil — yeşil WA Paylaş butonu ile tek tıkla paylaşabilirsiniz.',
        at: nowIso,
      };
      results.whatsapp = { ok: sentCount > 0, sentCount };
    } else if (target === 'whatsapp') {
      results.whatsapp = { ok: false, error: 'Duyuru numarası tanımlı değil; yeşil WA Paylaş butonunu kullanabilirsiniz.' };
    }
  }

  // 5. YouTube & Google Business Profile (via Dedicated or Universal Automation Webhook: Make / n8n / Zapier)
  const triggerWebhook = async (
    key: 'youtube' | 'googleBusiness',
    url: string,
    payload: Record<string, any>
  ) => {
    if (!url) {
      if (target === key) {
        results[key] = {
          ok: false,
          error: 'Otomatik gönderim için Webhook URL (Make/n8n/Zapier) ekleyin veya hazır metni tek tıkla kopyalayın.',
        };
      }
      return;
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Webhook HTTP ${res.status}`);
      pack.publishStatus[key] = {
        status: 'published',
        message: 'Otomasyon Webhook üzerinden gönderildi.',
        at: nowIso,
      };
      results[key] = { ok: true };
    } catch (err: any) {
      pack.publishStatus[key] = { status: 'failed', message: err?.message, at: nowIso };
      results[key] = { ok: false, error: err?.message };
    }
  };

  if ((target === 'all' || target === 'youtube') && config.youtube.enabled) {
    const ytUrl = config.youtube.webhookUrl || config.universalWebhookUrl;
    await triggerWebhook('youtube', ytUrl, {
      event: 'pekefe.social.youtube',
      product: { id: pack.productId, name: pack.productName, url: pack.productUrl, image: pack.productImage, price: pack.productPrice },
      youtube: pack.youtube,
      instagramReels: pack.instagram.reels,
    });
  }

  if ((target === 'all' || target === 'googleBusiness') && config.googleBusiness.enabled) {
    const gbpUrl = config.googleBusiness.webhookUrl || config.universalWebhookUrl;
    await triggerWebhook('googleBusiness', gbpUrl, {
      event: 'pekefe.social.google_business',
      product: { id: pack.productId, name: pack.productName, url: pack.productUrl, image: pack.productImage, price: pack.productPrice },
      googleBusiness: pack.googleBusiness,
    });
  }

  const nextPacks = [...config.packs];
  nextPacks[idx] = pack;
  await saveSocialMediaConfig({ packs: nextPacks });

  return { pack, results };
}

/**
 * Yeni urun eklendiginde (POST /api/products) arka planda cagrilir:
 * 5 platformluk kanca yontemli icerik paketini uretir ve bagli platformlara otomatik yayinlar.
 */
export async function handleNewProductSocialAutomation(
  product: SocialProductInput
): Promise<{ generated: boolean; packId?: string }> {
  try {
    const config = await getSocialMediaConfig();
    if (!config.enabled || !config.autoGenerateOnNewProduct) {
      return { generated: false };
    }
    const pack = await generateSocialPackForProduct(product);
    if (config.autoPublishOnNewProduct) {
      await publishSocialPack(pack.id, 'all').catch((e) =>
        console.warn('[SOCIAL AUTO-PUBLISH WARN]', e?.message)
      );
    }
    return { generated: true, packId: pack.id };
  } catch (err: any) {
    console.warn('[SOCIAL AUTOMATION ERROR]', err?.message);
    return { generated: false };
  }
}
