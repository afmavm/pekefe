import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { getSocialMediaConfig, GeneratedSocialPack } from '@/lib/social-media-engine';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type VisualFormat =
  | 'ig-post'
  | 'ig-story-1'
  | 'ig-story-2'
  | 'ig-story-3'
  | 'ig-reels'
  | 'fb-post'
  | 'wa-card'
  | 'yt-shorts'
  | 'gbp-post';

const DIMENSIONS: Record<VisualFormat, { width: number; height: number }> = {
  'ig-post': { width: 1080, height: 1350 },
  'ig-story-1': { width: 1080, height: 1920 },
  'ig-story-2': { width: 1080, height: 1920 },
  'ig-story-3': { width: 1080, height: 1920 },
  'ig-reels': { width: 1080, height: 1920 },
  'fb-post': { width: 1200, height: 630 },
  'wa-card': { width: 1080, height: 1080 },
  'yt-shorts': { width: 1080, height: 1920 },
  'gbp-post': { width: 1200, height: 900 },
};

function guessMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

async function resolveImageDataUri(rawUrl: string): Promise<string | null> {
  if (!rawUrl) return null;
  try {
    let relPath = rawUrl;
    if (relPath.startsWith('https://www.pekefe.com/')) {
      relPath = relPath.replace('https://www.pekefe.com', '');
    } else if (relPath.startsWith('https://pekefe.com/')) {
      relPath = relPath.replace('https://pekefe.com', '');
    }

    // 1. Try reading from local public/ directory (fastest & works offline/behind proxy)
    if (relPath.startsWith('/')) {
      const cleanRel = relPath.split('?')[0].replace(/^\/+/, '');
      const localPath = path.join(process.cwd(), 'public', cleanRel);
      if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
        const buf = fs.readFileSync(localPath);
        return `data:${guessMime(localPath)};base64,${buf.toString('base64')}`;
      }
    }

    // 2. Try fetching external image URL
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const res = await fetch(rawUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const ct = res.headers.get('content-type') || 'image/jpeg';
        const arr = await res.arrayBuffer();
        return `data:${ct};base64,${Buffer.from(arr).toString('base64')}`;
      }
    }
  } catch (err) {
    console.warn('[SOCIAL VISUAL] Image load fallback:', err);
  }

  // 3. Fallback to local PEKEFE default jar image
  try {
    const fallbackPath = path.join(process.cwd(), 'public', 'premium-pekefe-kavanoz.png');
    if (fs.existsSync(fallbackPath)) {
      const buf = fs.readFileSync(fallbackPath);
      return `data:image/png;base64,${buf.toString('base64')}`;
    }
  } catch {}
  return null;
}

function truncateText(str: string, max: number): string {
  const clean = String(str || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '…';
}

function formatPrice(price: number): string {
  if (!price || price <= 0) return 'Taze Mahsul';
  return `₺${Number(price).toLocaleString('tr-TR')}`;
}

function renderVerticalStoryOrCover(
  pack: GeneratedSocialPack,
  imgUri: string | null,
  format: 'ig-story-1' | 'ig-story-2' | 'ig-story-3' | 'ig-reels' | 'yt-shorts'
) {
  const isStory = format.startsWith('ig-story-');
  const slideIdx = format === 'ig-story-1' ? 0 : format === 'ig-story-2' ? 1 : 2;
  const slide = pack.instagram.story.slides?.[slideIdx];

  const badgeText =
    format === 'ig-reels'
      ? 'REELS · İSPİR YÖRESEL'
      : format === 'yt-shorts'
        ? 'YOUTUBE SHORTS · PEKEFE'
        : `HİKAYE ${slideIdx + 1}/3 · PEKEFE İSPİR`;

  const headline =
    format === 'ig-reels'
      ? truncateText(pack.instagram.reels.hook0_3s, 95)
      : format === 'yt-shorts'
        ? truncateText(pack.youtube.shortsTitle, 90)
        : truncateText(slide?.headline || pack.instagram.post.hook, 85);

  const subtext =
    format === 'ig-reels'
      ? truncateText(pack.instagram.reels.cta15_25s, 110)
      : format === 'yt-shorts'
        ? `${pack.productName} · %100 Doğal Erzurum İspir Üretimi`
        : truncateText(slide?.body || pack.productName, 120);

  const ctaLabel =
    format === 'ig-story-1'
      ? truncateText(slide?.stickerSuggestion || 'Anket: Doğal mı, Katkısız mı?', 60)
      : format === 'ig-story-2'
        ? truncateText(slide?.stickerSuggestion || '%100 Katkısız · Geleneksel Üretim', 60)
        : format === 'ig-reels'
          ? 'İZLE VE KAYDET ▶ pekefe.com'
          : format === 'yt-shorts'
            ? 'SİPARİŞ İÇİN: WWW.PEKEFE.COM'
            : `ŞİMDİ İNCELE · ${formatPrice(pack.productPrice)} →`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(160deg, #3b0d19 0%, #6b1d2f 48%, #2a0a12 100%)',
        padding: '64px 60px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Top Bar: Story Progress or Brand Pill */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {isStory && (
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: i <= slideIdx ? '#f59e0b' : 'rgba(255,255,255,0.22)',
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 26px',
              borderRadius: '999px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '2px solid rgba(245, 158, 11, 0.7)',
              color: '#fde68a',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '2px',
            }}
          >
            {badgeText}
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 900,
              letterSpacing: '3px',
              color: '#ffffff',
            }}
          >
            PEKEFE
          </div>
        </div>

        {/* Hook Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '12px',
            padding: '32px 36px',
            borderRadius: '32px',
            backgroundColor: 'rgba(0,0,0,0.32)',
            border: '2px solid rgba(253,230,138,0.28)',
          }}
        >
          <div
            style={{
              fontSize: format === 'yt-shorts' ? '56px' : '50px',
              fontWeight: 900,
              lineHeight: 1.18,
              color: format === 'yt-shorts' ? '#fde047' : '#ffffff',
            }}
          >
            {headline}
          </div>
          <div
            style={{
              marginTop: '18px',
              fontSize: '28px',
              lineHeight: 1.4,
              color: '#f1e4e7',
              fontWeight: 500,
            }}
          >
            {subtext}
          </div>
        </div>
      </div>

      {/* Center Product Visual Frame */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginTop: '24px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: '760px',
            height: '760px',
            borderRadius: '48px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            border: '8px solid rgba(245, 158, 11, 0.75)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          }}
        >
          {imgUri ? (
            <img
              src={imgUri}
              alt={pack.productName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ fontSize: '42px', color: '#6b1d2f', fontWeight: 900 }}>
              {pack.productName}
            </div>
          )}
        </div>

        {/* Floating Price Badge */}
        {pack.productPrice > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '28px',
              right: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 38px',
              borderRadius: '28px',
              backgroundColor: '#f59e0b',
              color: '#2a0a12',
              border: '4px solid #ffffff',
              boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>
              TAZE MAHSUL
            </span>
            <span style={{ fontSize: '44px', fontWeight: 900 }}>{formatPrice(pack.productPrice)}</span>
          </div>
        )}
      </div>

      {/* Bottom CTA Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px 36px',
            borderRadius: '28px',
            backgroundColor: '#ffffff',
            color: '#6b1d2f',
            fontSize: '30px',
            fontWeight: 900,
            textAlign: 'center',
          }}
        >
          {ctaLabel}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '22px',
            color: '#fde68a',
            fontWeight: 700,
            paddingLeft: '8px',
            paddingRight: '8px',
          }}
        >
          <span>ERZURUM İSPİR · %100 DOĞAL</span>
          <span>www.pekefe.com</span>
        </div>
      </div>
    </div>
  );
}

function renderInstagramPost(pack: GeneratedSocialPack, imgUri: string | null) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(155deg, #fdf8f4 0%, #f5e6dc 55%, #edd5c5 100%)',
        padding: '48px 52px',
        color: '#2a0a12',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Top Brand + Category */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            padding: '10px 24px',
            borderRadius: '999px',
            backgroundColor: '#6b1d2f',
            color: '#fde68a',
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '2px',
          }}
        >
          %100 DOĞAL · İSPİR YÖRESEL
        </div>
        <div style={{ fontSize: '28px', fontWeight: 900, color: '#6b1d2f', letterSpacing: '3px' }}>
          PEKEFE
        </div>
      </div>

      {/* Hook Banner */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: '20px',
          padding: '26px 32px',
          borderRadius: '28px',
          backgroundColor: '#6b1d2f',
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.2 }}>
          {truncateText(pack.instagram.post.hook, 88)}
        </div>
      </div>

      {/* Center Product Photo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginTop: '24px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: '760px',
            height: '660px',
            borderRadius: '36px',
            overflow: 'hidden',
            display: 'flex',
            backgroundColor: '#ffffff',
            border: '6px solid #6b1d2f',
            boxShadow: '0 24px 60px rgba(107,29,47,0.22)',
          }}
        >
          {imgUri ? (
            <img
              src={imgUri}
              alt={pack.productName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ margin: 'auto', fontSize: '36px', fontWeight: 900, color: '#6b1d2f' }}>
              {pack.productName}
            </div>
          )}
        </div>

        {pack.productPrice > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '130px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 34px',
              borderRadius: '24px',
              backgroundColor: '#f59e0b',
              color: '#2a0a12',
              border: '4px solid #ffffff',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 800 }}>ŞİMDİ SİPARİŞ</span>
            <span style={{ fontSize: '40px', fontWeight: 900 }}>{formatPrice(pack.productPrice)}</span>
          </div>
        )}
      </div>

      {/* Bottom Product Title & CTA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 30px',
          borderRadius: '24px',
          backgroundColor: '#ffffff',
          border: '2px solid rgba(107,29,47,0.18)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '640px' }}>
          <span style={{ fontSize: '28px', fontWeight: 900, color: '#6b1d2f' }}>
            {truncateText(pack.productName, 44)}
          </span>
          <span style={{ fontSize: '20px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
            Katkısız · Geleneksel Reçete · Güvenli Kargo
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            padding: '14px 26px',
            borderRadius: '18px',
            backgroundColor: '#6b1d2f',
            color: '#ffffff',
            fontSize: '22px',
            fontWeight: 800,
          }}
        >
          pekefe.com →
        </div>
      </div>
    </div>
  );
}

function renderWhatsAppCard(pack: GeneratedSocialPack, imgUri: string | null) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(150deg, #064e3b 0%, #065f46 45%, #022c22 100%)',
        padding: '48px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            padding: '10px 24px',
            borderRadius: '999px',
            backgroundColor: 'rgba(52, 211, 153, 0.2)',
            border: '2px solid #34d399',
            color: '#a7f3d0',
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '2px',
          }}
        >
          YENİ MAHSUL · WHATSAPP DUYURU
        </div>
        <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '3px' }}>PEKEFE</div>
      </div>

      <div style={{ display: 'flex', gap: '36px', alignItems: 'center', marginTop: '24px', marginBottom: '24px' }}>
        <div
          style={{
            width: '470px',
            height: '560px',
            borderRadius: '32px',
            overflow: 'hidden',
            display: 'flex',
            backgroundColor: '#ffffff',
            border: '6px solid #34d399',
            flexShrink: 0,
          }}
        >
          {imgUri && (
            <img
              src={imgUri}
              alt={pack.productName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', flex: 1 }}>
          <div style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1.2, color: '#ffffff' }}>
            {truncateText(pack.productName, 48)}
          </div>
          <div style={{ fontSize: '24px', lineHeight: 1.45, color: '#d1fae5', fontWeight: 500 }}>
            {truncateText(pack.whatsapp.statusCaption, 130)}
          </div>
          {pack.productPrice > 0 && (
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                padding: '14px 32px',
                borderRadius: '20px',
                backgroundColor: '#f59e0b',
                color: '#1e1b18',
                fontSize: '40px',
                fontWeight: 900,
              }}
            >
              {formatPrice(pack.productPrice)}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 32px',
          borderRadius: '24px',
          backgroundColor: '#ffffff',
          color: '#064e3b',
          fontSize: '24px',
          fontWeight: 900,
        }}
      >
        <span>Hızlı Sipariş: +90 534 270 91 40</span>
        <span>www.pekefe.com →</span>
      </div>
    </div>
  );
}

function renderHorizontalCard(
  pack: GeneratedSocialPack,
  imgUri: string | null,
  format: 'fb-post' | 'gbp-post'
) {
  const isGbp = format === 'gbp-post';
  const badge = isGbp ? 'ERZURUM İSPİR · GOOGLE İŞLETME' : 'PEKEFE İSPİR YÖRESEL · YENİ ÜRÜN';
  const headline = isGbp
    ? truncateText(pack.productName, 56)
    : truncateText(pack.facebook.hook, 80);
  const body = isGbp
    ? truncateText(pack.googleBusiness.summary, 155)
    : truncateText(pack.facebook.questionForEngagement || pack.facebook.postText, 135);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        background: isGbp
          ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          : 'linear-gradient(135deg, #4c1121 0%, #6b1d2f 60%, #2a0a12 100%)',
        padding: isGbp ? '52px' : '42px',
        gap: '42px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Left Image */}
      <div
        style={{
          width: isGbp ? '480px' : '460px',
          height: '100%',
          borderRadius: '30px',
          overflow: 'hidden',
          display: 'flex',
          backgroundColor: '#ffffff',
          border: '5px solid rgba(245, 158, 11, 0.8)',
          flexShrink: 0,
        }}
      >
        {imgUri && (
          <img
            src={imgUri}
            alt={pack.productName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Right Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '8px 20px',
              borderRadius: '999px',
              backgroundColor: 'rgba(245, 158, 11, 0.22)',
              border: '2px solid rgba(245, 158, 11, 0.75)',
              color: '#fde68a',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '1.5px',
            }}
          >
            {badge}
          </div>

          <div style={{ fontSize: isGbp ? '46px' : '38px', fontWeight: 900, lineHeight: 1.18 }}>
            {headline}
          </div>

          <div
            style={{
              fontSize: isGbp ? '24px' : '22px',
              lineHeight: 1.45,
              color: '#e2e8f0',
              fontWeight: 500,
            }}
          >
            {body}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          {pack.productPrice > 0 ? (
            <div
              style={{
                display: 'flex',
                padding: '14px 28px',
                borderRadius: '18px',
                backgroundColor: '#f59e0b',
                color: '#1e1b18',
                fontSize: '34px',
                fontWeight: 900,
              }}
            >
              {formatPrice(pack.productPrice)}
            </div>
          ) : (
            <div />
          )}

          <div
            style={{
              display: 'flex',
              padding: '16px 28px',
              borderRadius: '18px',
              backgroundColor: '#ffffff',
              color: '#6b1d2f',
              fontSize: '22px',
              fontWeight: 900,
            }}
          >
            Sipariş Ver · pekefe.com →
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const packId = searchParams.get('packId') || '';
    const formatParam = (searchParams.get('format') || 'ig-post') as VisualFormat;
    const download = searchParams.get('download') === '1';

    const format: VisualFormat = DIMENSIONS[formatParam] ? formatParam : 'ig-post';
    const { width, height } = DIMENSIONS[format];

    const config = await getSocialMediaConfig();
    const pack = config.packs.find((p) => p.id === packId) || config.packs[0];

    if (!pack) {
      return NextResponse.json({ error: 'İçerik paketi bulunamadı.' }, { status: 404 });
    }

    const imgUri = await resolveImageDataUri(pack.productImage);

    let element: React.ReactElement;
    if (format === 'ig-post') {
      element = renderInstagramPost(pack, imgUri);
    } else if (format === 'wa-card') {
      element = renderWhatsAppCard(pack, imgUri);
    } else if (format === 'fb-post' || format === 'gbp-post') {
      element = renderHorizontalCard(pack, imgUri, format);
    } else {
      element = renderVerticalStoryOrCover(pack, imgUri, format);
    }

    const headers: Record<string, string> = {
      'Cache-Control': 'public, max-age=3600',
    };
    if (download) {
      const safeSlug = (pack.productSlug || 'pekefe-urun').replace(/[^a-z0-9-_]/gi, '');
      headers['Content-Disposition'] = `attachment; filename="pekefe-${safeSlug}-${format}.png"`;
    }

    return new ImageResponse(element, {
      width,
      height,
      headers,
    });
  } catch (error: any) {
    console.error('[SOCIAL VISUAL ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Görsel oluşturulamadı.' }, { status: 500 });
  }
}
