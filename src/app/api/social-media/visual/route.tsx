import { NextRequest, NextResponse } from 'next/server';
import { getSocialMediaConfig, GeneratedSocialPack } from '@/lib/social-media-engine';
import sharp from 'sharp';
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

interface VisualTheme {
  name: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  cardBg: string;
  cardStroke: string;
  titleColor: string;
  subColor: string;
  accentBg: string;
  accentText: string;
  pillBg: string;
  pillText: string;
  ctaBg: string;
  ctaText: string;
  footerText: string;
  imgBorder: string;
}

const THEMES: VisualTheme[] = [
  // 0: Kraliyet Bordo & Altın (PEKEFE Signature)
  {
    name: 'Kraliyet Bordo',
    bgStart: '#3d0d19',
    bgMid: '#6b1d2f',
    bgEnd: '#280810',
    cardBg: 'rgba(0,0,0,0.28)',
    cardStroke: 'rgba(253,230,138,0.35)',
    titleColor: '#ffffff',
    subColor: '#f3e5e8',
    accentBg: '#f59e0b',
    accentText: '#23070e',
    pillBg: 'rgba(245,158,11,0.22)',
    pillText: '#fde68a',
    ctaBg: '#ffffff',
    ctaText: '#6b1d2f',
    footerText: '#fde68a',
    imgBorder: '#f59e0b',
  },
  // 1: Doğal Krem & Toprak (Warm Organic)
  {
    name: 'Doğal Krem',
    bgStart: '#fdf9f5',
    bgMid: '#f6ebe0',
    bgEnd: '#ecdbc9',
    cardBg: '#6b1d2f',
    cardStroke: '#8b2b41',
    titleColor: '#ffffff',
    subColor: '#fde68a',
    accentBg: '#d97706',
    accentText: '#ffffff',
    pillBg: '#6b1d2f',
    pillText: '#fde68a',
    ctaBg: '#6b1d2f',
    ctaText: '#ffffff',
    footerText: '#6b1d2f',
    imgBorder: '#6b1d2f',
  },
  // 2: Gece Siyahı & Altın Lüks (Editorial Dark)
  {
    name: 'Gece Lüks',
    bgStart: '#0f172a',
    bgMid: '#1e1b18',
    bgEnd: '#09090b',
    cardBg: 'rgba(255,255,255,0.06)',
    cardStroke: 'rgba(251,191,36,0.45)',
    titleColor: '#fef08a',
    subColor: '#e2e8f0',
    accentBg: '#fbbf24',
    accentText: '#0f172a',
    pillBg: 'rgba(251,191,36,0.18)',
    pillText: '#fde047',
    ctaBg: '#fbbf24',
    ctaText: '#0f172a',
    footerText: '#cbd5e1',
    imgBorder: '#fbbf24',
  },
  // 3: İspir Yayla Zümrüt & Altın (Natural Heritage)
  {
    name: 'Yayla Zümrüt',
    bgStart: '#064e3b',
    bgMid: '#065f46',
    bgEnd: '#022c22',
    cardBg: 'rgba(0,0,0,0.24)',
    cardStroke: 'rgba(110,231,183,0.38)',
    titleColor: '#ffffff',
    subColor: '#d1fae5',
    accentBg: '#f59e0b',
    accentText: '#1c1917',
    pillBg: 'rgba(52,211,153,0.22)',
    pillText: '#a7f3d0',
    ctaBg: '#ffffff',
    ctaText: '#064e3b',
    footerText: '#a7f3d0',
    imgBorder: '#34d399',
  },
  // 4: Altın Hasat & Kehribar (Golden Harvest)
  {
    name: 'Altın Hasat',
    bgStart: '#78350f',
    bgMid: '#92400e',
    bgEnd: '#451a03',
    cardBg: 'rgba(0,0,0,0.26)',
    cardStroke: 'rgba(254,243,199,0.4)',
    titleColor: '#fffbeb',
    subColor: '#fef3c7',
    accentBg: '#6b1d2f',
    accentText: '#ffffff',
    pillBg: 'rgba(255,251,235,0.2)',
    pillText: '#fef3c7',
    ctaBg: '#fffbeb',
    ctaText: '#78350f',
    footerText: '#fde68a',
    imgBorder: '#fde68a',
  },
];

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // Strip emojis that librsvg can't render
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const clean = escapeXml(text);
  if (!clean) return [];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? last.slice(0, maxCharsPerLine - 1) + '…' : last;
  }
  return lines;
}

function renderMultilineSvgText(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  fontSize: number,
  fill: string,
  fontWeight: number | string = 800,
  anchor: 'start' | 'middle' | 'end' = 'start'
): string {
  if (lines.length === 0) return '';
  const tspans = lines
    .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`)
    .join('');
  return `<text x="${x}" y="${startY}" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${anchor}">${tspans}</text>`;
}

function formatPrice(price: number): string {
  if (!price || price <= 0) return 'TAZE MAHSUL';
  return `${Number(price).toLocaleString('tr-TR')} TL`;
}

async function loadProductImageBuffer(rawUrl: string): Promise<Buffer | null> {
  if (rawUrl) {
    try {
      let relPath = rawUrl;
      if (relPath.startsWith('https://www.pekefe.com/')) {
        relPath = relPath.replace('https://www.pekefe.com', '');
      } else if (relPath.startsWith('https://pekefe.com/')) {
        relPath = relPath.replace('https://pekefe.com', '');
      }

      if (relPath.startsWith('/')) {
        const cleanRel = relPath.split('?')[0].replace(/^\/+/, '');
        const localPath = path.join(process.cwd(), 'public', cleanRel);
        if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
          return fs.readFileSync(localPath);
        }
      }

      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        const res = await fetch(rawUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          return Buffer.from(await res.arrayBuffer());
        }
      }
    } catch (err) {
      console.warn('[SOCIAL VISUAL] Product image load warning:', err);
    }
  }

  for (const fallbackFile of ['premium-pekefe-kavanoz.png', 'pekefe-dut-pekmezi-kavanoz-tr.jpg', 'logo.png']) {
    const p = path.join(process.cwd(), 'public', fallbackFile);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}

async function makeRoundedImage(
  imgBuf: Buffer,
  width: number,
  height: number,
  radius: number
): Promise<Buffer> {
  const maskSvg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#ffffff"/></svg>`
  );

  return sharp(imgBuf)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function renderVisualPng(
  pack: GeneratedSocialPack,
  format: VisualFormat,
  variantIndex: number
): Promise<Buffer> {
  const { width, height } = DIMENSIONS[format];
  const defaultThemeIdx =
    format === 'wa-card' ? 3 : format === 'ig-post' ? 1 : format === 'yt-shorts' ? 2 : 0;
  const theme = THEMES[(defaultThemeIdx + variantIndex) % THEMES.length];

  const rawImgBuf = await loadProductImageBuffer(pack.productImage);
  const priceText = formatPrice(pack.productPrice);

  let svgOverlay = '';
  let imgBox = { x: 160, y: 420, w: 760, h: 620, r: 36 };

  if (format === 'ig-post') {
    // 1080 x 1350 (4:5)
    imgBox = { x: 140, y: 440, w: 800, h: 620, r: 36 };
    const hookLines = wrapLines(pack.instagram.post.hook, 32, 3);
    const titleLines = wrapLines(pack.productName, 34, 1);

    svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.bgStart}"/>
            <stop offset="55%" stop-color="${theme.bgMid}"/>
            <stop offset="100%" stop-color="${theme.bgEnd}"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <circle cx="980" cy="120" r="240" fill="${theme.imgBorder}" fill-opacity="0.10"/>
        <circle cx="80" cy="1240" r="220" fill="${theme.imgBorder}" fill-opacity="0.08"/>

        <!-- Top Badge & Brand -->
        <rect x="64" y="54" width="430" height="54" rx="27" fill="${theme.pillBg}" stroke="${theme.cardStroke}" stroke-width="2"/>
        <text x="279" y="88" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="800" fill="${theme.pillText}" text-anchor="middle" letter-spacing="2">%100 DOGAL · ISPIR YORESEL</text>
        <text x="1016" y="92" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="900" fill="${theme.footerText}" text-anchor="end" letter-spacing="4">PEKEFE</text>

        <!-- Hook Banner -->
        <rect x="64" y="140" width="952" height="250" rx="30" fill="${theme.cardBg}" stroke="${theme.cardStroke}" stroke-width="2.5"/>
        ${renderMultilineSvgText(hookLines, 104, 215, 58, 42, theme.titleColor, 900, 'start')}

        <!-- Image Border Frame -->
        <rect x="${imgBox.x - 6}" y="${imgBox.y - 6}" width="${imgBox.w + 12}" height="${imgBox.h + 12}" rx="${imgBox.r + 4}" fill="none" stroke="${theme.imgBorder}" stroke-width="8"/>

        <!-- Bottom Info Bar -->
        <rect x="64" y="1120" width="952" height="164" rx="28" fill="${theme.ctaBg}" stroke="${theme.cardStroke}" stroke-width="2"/>
        ${renderMultilineSvgText(titleLines, 102, 1188, 38, 30, theme.ctaText, 900, 'start')}
        <text x="102" y="1234" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="600" fill="${theme.ctaText}" fill-opacity="0.78">Katkisiz · Geleneksel Uretim · www.pekefe.com</text>

        <!-- Price Pill -->
        <rect x="748" y="1146" width="236" height="112" rx="22" fill="${theme.accentBg}"/>
        <text x="866" y="1186" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="800" fill="${theme.accentText}" text-anchor="middle">TAZE MAHSUL</text>
        <text x="866" y="1236" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="900" fill="${theme.accentText}" text-anchor="middle">${escapeXml(priceText)}</text>
      </svg>`;
  } else if (format === 'wa-card') {
    // 1080 x 1080 (1:1)
    imgBox = { x: 64, y: 200, w: 460, h: 610, r: 32 };
    const titleLines = wrapLines(pack.productName, 19, 3);
    const captionLines = wrapLines(pack.whatsapp.statusCaption, 26, 4);

    svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.bgStart}"/>
            <stop offset="50%" stop-color="${theme.bgMid}"/>
            <stop offset="100%" stop-color="${theme.bgEnd}"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>

        <rect x="64" y="64" width="460" height="54" rx="27" fill="${theme.pillBg}" stroke="${theme.cardStroke}" stroke-width="2"/>
        <text x="294" y="98" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="800" fill="${theme.pillText}" text-anchor="middle" letter-spacing="2">WHATSAPP YENI MAHSUL DUYURU</text>
        <text x="1016" y="102" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="900" fill="${theme.footerText}" text-anchor="end" letter-spacing="4">PEKEFE</text>

        <rect x="${imgBox.x - 6}" y="${imgBox.y - 6}" width="${imgBox.w + 12}" height="${imgBox.h + 12}" rx="${imgBox.r + 4}" fill="none" stroke="${theme.imgBorder}" stroke-width="8"/>

        <!-- Right Text Column -->
        ${renderMultilineSvgText(titleLines, 568, 275, 52, 40, theme.titleColor, 900, 'start')}
        ${renderMultilineSvgText(captionLines, 568, 470, 38, 25, theme.subColor, 500, 'start')}

        <!-- Price Badge -->
        <rect x="568" y="680" width="290" height="106" rx="24" fill="${theme.accentBg}"/>
        <text x="713" y="748" font-family="DejaVu Sans, Arial, sans-serif" font-size="42" font-weight="900" fill="${theme.accentText}" text-anchor="middle">${escapeXml(priceText)}</text>

        <!-- Footer CTA -->
        <rect x="64" y="884" width="952" height="126" rx="26" fill="${theme.ctaBg}"/>
        <text x="106" y="958" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="900" fill="${theme.ctaText}">Siparis Hatti: +90 534 270 91 40</text>
        <text x="974" y="958" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="900" fill="${theme.ctaText}" text-anchor="end">www.pekefe.com</text>
      </svg>`;
  } else if (format === 'fb-post' || format === 'gbp-post') {
    // 1200 x 630 or 1200 x 900
    const isGbp = format === 'gbp-post';
    imgBox = isGbp
      ? { x: 56, y: 120, w: 470, h: 660, r: 30 }
      : { x: 48, y: 56, w: 450, h: 518, r: 28 };
    const badge = isGbp ? 'ERZURUM ISPIR · GOOGLE ISLETME' : 'PEKEFE ISPIR · YENI URUN';
    const headlineRaw = isGbp ? pack.productName : pack.facebook.hook;
    const bodyRaw = isGbp
      ? pack.googleBusiness.summary
      : pack.facebook.questionForEngagement || pack.facebook.postText;

    const headLines = wrapLines(headlineRaw, 25, 3);
    const bodyLines = wrapLines(bodyRaw, 38, isGbp ? 5 : 4);
    const rx = isGbp ? 574 : 542;

    svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.bgStart}"/>
            <stop offset="55%" stop-color="${theme.bgMid}"/>
            <stop offset="100%" stop-color="${theme.bgEnd}"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <rect x="${imgBox.x - 6}" y="${imgBox.y - 6}" width="${imgBox.w + 12}" height="${imgBox.h + 12}" rx="${imgBox.r + 4}" fill="none" stroke="${theme.imgBorder}" stroke-width="7"/>

        <rect x="${rx}" y="${isGbp ? 120 : 58}" width="440" height="46" rx="23" fill="${theme.pillBg}" stroke="${theme.cardStroke}" stroke-width="2"/>
        <text x="${rx + 220}" y="${isGbp ? 149 : 87}" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="800" fill="${theme.pillText}" text-anchor="middle" letter-spacing="1.5">${badge}</text>

        ${renderMultilineSvgText(headLines, rx, isGbp ? 240 : 172, isGbp ? 56 : 48, isGbp ? 42 : 36, theme.titleColor, 900, 'start')}
        ${renderMultilineSvgText(bodyLines, rx, isGbp ? 440 : 345, 36, 23, theme.subColor, 500, 'start')}

        <!-- Price + CTA -->
        <rect x="${rx}" y="${height - 140}" width="220" height="84" rx="20" fill="${theme.accentBg}"/>
        <text x="${rx + 110}" y="${height - 86}" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="900" fill="${theme.accentText}" text-anchor="middle">${escapeXml(priceText)}</text>

        <rect x="${rx + 240}" y="${height - 140}" width="340" height="84" rx="20" fill="${theme.ctaBg}"/>
        <text x="${rx + 410}" y="${height - 89}" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="900" fill="${theme.ctaText}" text-anchor="middle">Siparis Ver · pekefe.com</text>
      </svg>`;
  } else {
    // 1080 x 1920 (9:16) — ig-story-1/2/3, ig-reels, yt-shorts
    const isStory = format.startsWith('ig-story-');
    const slideIdx = format === 'ig-story-1' ? 0 : format === 'ig-story-2' ? 1 : 2;
    const slide = pack.instagram.story.slides?.[slideIdx];

    const badge =
      format === 'ig-reels'
        ? 'REELS · ISPIR YORESEL'
        : format === 'yt-shorts'
          ? 'YOUTUBE SHORTS · PEKEFE'
          : `HIKAYE ${slideIdx + 1}/3 · PEKEFE ISPIR`;

    const headlineRaw =
      format === 'ig-reels'
        ? pack.instagram.reels.hook0_3s
        : format === 'yt-shorts'
          ? pack.youtube.shortsTitle
          : slide?.headline || pack.instagram.post.hook;

    const subRaw =
      format === 'ig-reels'
        ? pack.instagram.reels.cta15_25s
        : format === 'yt-shorts'
          ? `${pack.productName} · %100 Dogal Erzurum Ispir Uretimi`
          : slide?.body || pack.productName;

    const ctaRaw =
      format === 'ig-story-1'
        ? slide?.stickerSuggestion || 'Anket: Dogal mi, Katkisiz mi?'
        : format === 'ig-story-2'
          ? slide?.stickerSuggestion || '%100 Katkisiz · Geleneksel Uretim'
          : format === 'ig-reels'
            ? 'IZLE VE KAYDET · www.pekefe.com'
            : format === 'yt-shorts'
              ? 'SIPARIS ICIN: WWW.PEKEFE.COM'
              : `SIMDI INCELE · ${priceText}`;

    imgBox = { x: 140, y: 740, w: 800, h: 760, r: 44 };
    const headLines = wrapLines(headlineRaw, 26, 3);
    const subLines = wrapLines(subRaw, 38, 3);

    const progressBars = isStory
      ? [0, 1, 2]
          .map(
            (i) =>
              `<rect x="${64 + i * 324}" y="54" width="304" height="10" rx="5" fill="${
                i <= slideIdx ? theme.imgBorder : 'rgba(255,255,255,0.22)'
              }"/>`
          )
          .join('')
      : '';

    svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.bgStart}"/>
            <stop offset="50%" stop-color="${theme.bgMid}"/>
            <stop offset="100%" stop-color="${theme.bgEnd}"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        ${progressBars}

        <!-- Top Badge & Logo -->
        <rect x="64" y="106" width="460" height="58" rx="29" fill="${theme.pillBg}" stroke="${theme.cardStroke}" stroke-width="2"/>
        <text x="294" y="143" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="800" fill="${theme.pillText}" text-anchor="middle" letter-spacing="2">${badge}</text>
        <text x="1016" y="146" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="900" fill="${theme.footerText}" text-anchor="end" letter-spacing="4">PEKEFE</text>

        <!-- Hook Card -->
        <rect x="64" y="206" width="952" height="474" rx="36" fill="${theme.cardBg}" stroke="${theme.cardStroke}" stroke-width="2.5"/>
        ${renderMultilineSvgText(headLines, 110, 298, 64, 48, theme.titleColor, 900, 'start')}
        ${renderMultilineSvgText(subLines, 110, 520, 42, 28, theme.subColor, 500, 'start')}

        <!-- Product Image Frame -->
        <rect x="${imgBox.x - 8}" y="${imgBox.y - 8}" width="${imgBox.w + 16}" height="${imgBox.h + 16}" rx="${imgBox.r + 6}" fill="none" stroke="${theme.imgBorder}" stroke-width="9"/>

        <!-- Price Badge below Image -->
        <rect x="330" y="1552" width="420" height="92" rx="26" fill="${theme.accentBg}"/>
        <text x="540" y="1613" font-family="DejaVu Sans, Arial, sans-serif" font-size="42" font-weight="900" fill="${theme.accentText}" text-anchor="middle">${escapeXml(priceText)}</text>

        <!-- Bottom CTA Pill -->
        <rect x="64" y="1684" width="952" height="114" rx="30" fill="${theme.ctaBg}"/>
        <text x="540" y="1752" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="900" fill="${theme.ctaText}" text-anchor="middle">${escapeXml(ctaRaw.slice(0, 48))}</text>

        <!-- Footer -->
        <text x="64" y="1858" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="700" fill="${theme.footerText}">ERZURUM ISPIR · %100 DOGAL</text>
        <text x="1016" y="1858" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="700" fill="${theme.footerText}" text-anchor="end">www.pekefe.com</text>
      </svg>`;
  }

  const composites: sharp.OverlayOptions[] = [];
  if (rawImgBuf) {
    try {
      const roundedImg = await makeRoundedImage(rawImgBuf, imgBox.w, imgBox.h, imgBox.r);
      composites.push({ input: roundedImg, left: imgBox.x, top: imgBox.y });
    } catch (imgErr) {
      console.warn('[SOCIAL VISUAL] Image composite skipped:', imgErr);
    }
  }

  return sharp(Buffer.from(svgOverlay))
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toBuffer();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const packId = searchParams.get('packId') || '';
    const formatParam = (searchParams.get('format') || 'ig-post') as VisualFormat;
    const variantRaw = Number(searchParams.get('v') || searchParams.get('variant') || 0);
    const variantIndex = Number.isFinite(variantRaw) ? Math.abs(Math.floor(variantRaw)) : 0;
    const download = searchParams.get('download') === '1';

    const format: VisualFormat = DIMENSIONS[formatParam] ? formatParam : 'ig-post';

    const config = await getSocialMediaConfig();
    const pack = config.packs.find((p) => p.id === packId) || config.packs[0];

    if (!pack) {
      return NextResponse.json({ error: 'İçerik paketi bulunamadı.' }, { status: 404 });
    }

    const pngBuffer = await renderVisualPng(pack, format, variantIndex);

    const headers: Record<string, string> = {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };
    if (download) {
      const safeSlug = (pack.productSlug || 'pekefe-urun').replace(/[^a-z0-9-_]/gi, '');
      headers['Content-Disposition'] = `attachment; filename="pekefe-${safeSlug}-${format}-v${variantIndex + 1}.png"`;
    }

    return new NextResponse(new Uint8Array(pngBuffer), { status: 200, headers });
  } catch (error: any) {
    console.error('[SOCIAL VISUAL ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Görsel oluşturulamadı.' }, { status: 500 });
  }
}
