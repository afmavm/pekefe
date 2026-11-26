import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import {
  getSocialMediaConfig,
  saveSocialMediaConfig,
  AiGeneratedVisualItem,
} from '@/lib/social-media-engine';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AiFormat = 'ig-post' | 'ig-story' | 'wa-card' | 'fb-post' | 'gbp-post';
type AiStyle =
  | 'ispir-sunlight'
  | 'marble-studio'
  | 'rustic-table'
  | 'golden-cinematic'
  | 'minimal-cream';

const FORMAT_SPECS: Record<
  AiFormat,
  { width: number; height: number; genW: number; genH: number; aspect: string; label: string }
> = {
  'ig-post': { width: 1080, height: 1350, genW: 896, genH: 1120, aspect: '4:5', label: 'Instagram Post' },
  'ig-story': { width: 1080, height: 1920, genW: 768, genH: 1344, aspect: '9:16', label: 'Story / Reels / Shorts' },
  'wa-card': { width: 1080, height: 1080, genW: 1024, genH: 1024, aspect: '1:1', label: 'WhatsApp Kartı' },
  'fb-post': { width: 1200, height: 630, genW: 1200, genH: 630, aspect: '16:9', label: 'Facebook Görseli' },
  'gbp-post': { width: 1200, height: 900, genW: 1152, genH: 864, aspect: '4:3', label: 'Google İşletme' },
};

const STYLE_PROMPTS: Record<AiStyle, string> = {
  'ispir-sunlight':
    'sun-drenched Anatolian highland terrace in Ispir Turkey, warm morning golden sunlight filtering through green mulberry leaves, rustic stone and warm walnut wood surface, scattered fresh walnuts and golden honey-like amber light, editorial gourmet food photography, shallow depth of field, 8k',
  'marble-studio':
    'luxury dark burgundy and warm cream veined Italian marble podium, soft architectural studio rim lighting, subtle golden dust particles, warm amber highlights, high-end Michelin gourmet commercial product backdrop, ultra clean composition, 8k',
  'rustic-table':
    'authentic artisanal Turkish breakfast wooden table made of aged walnut, hand-hammered copper spoon, linen napkin, warm ceramic bowl of walnuts, soft window light, cozy heritage culinary magazine photography, rich textures, 8k',
  'golden-cinematic':
    'cinematic moody dark editorial photography, dramatic warm golden hour spotlight from the side, deep espresso and burgundy shadows, glowing amber droplets and natural organic textures, luxury gourmet advertising backdrop, 8k',
  'minimal-cream':
    'ultra-clean modern minimalist warm alabaster and travertine stone studio surface, soft diffused daylight, delicate natural botanical shadow of mulberry branch, Scandinavian-meets-Anatolian luxury organic skincare-grade food aesthetic, 8k',
};

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = escapeXml(text).split(' ').filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

async function buildEnrichedPrompt(params: {
  productName: string;
  productCategory: string;
  style: AiStyle;
  mode: 'branded' | 'scene-only';
  customPrompt?: string;
}): Promise<string> {
  const styleDesc = STYLE_PROMPTS[params.style] || STYLE_PROMPTS['ispir-sunlight'];
  const basePrompt =
    params.mode === 'branded'
      ? `Commercial luxury food photography background scene designed for ${params.productName} (${params.productCategory}), ${styleDesc}. Leave clean atmospheric breathing room in the center for product placement. Photorealistic, shot on 85mm lens, f/1.8, strictly NO text, NO letters, NO logos, NO watermark.`
      : `Luxury commercial food editorial photograph featuring traditional Turkish ${params.productName} (${params.productCategory}), ${styleDesc}. Mouthwatering artisan presentation, shot on 85mm lens, f/1.8, strictly NO text, NO letters, NO logos, NO watermark.`;

  const userNote = String(params.customPrompt || '').trim();
  if (!userNote) return basePrompt;

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (apiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Convert this Turkish creative direction into a concise, vivid English commercial food photography prompt (max 55 words). Merge it naturally with this style: "${styleDesc}". Product: "${params.productName}". Mode: ${params.mode === 'branded' ? 'clean background backdrop with center negative space' : 'full editorial hero food shot'}. Turkish user request: "${userNote}". Output ONLY the English prompt, no quotes, and end with "strictly no text, no letters, no watermark".`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 160 },
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && text.length > 20) return text;
      }
    } catch {
      // fallback to base prompt with user note appended
    }
  }

  return `${basePrompt} Additional creative detail: ${userNote}.`;
}

async function generateWithGoogleGemini(
  prompt: string
): Promise<{ buffer: Buffer; provider: 'google-gemini' | 'google-imagen' } | null> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;

  // 1. Try Gemini native image generation model
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const parts = json?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        const b64 = part?.inlineData?.data;
        if (b64) {
          return { buffer: Buffer.from(b64, 'base64'), provider: 'google-gemini' };
        }
      }
    }
  } catch {
    // try Imagen 3 next
  }

  // 2. Try Google Imagen 3 predict endpoint
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const b64 = json?.predictions?.[0]?.bytesBase64Encoded;
      if (b64) {
        return { buffer: Buffer.from(b64, 'base64'), provider: 'google-imagen' };
      }
    }
  } catch {
    // fall through to free FLUX
  }

  return null;
}

async function generateWithFreeFlux(
  prompt: string,
  width: number,
  height: number
): Promise<Buffer | null> {
  const seed = Math.floor(Math.random() * 9999999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 40000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PEKEFE-SocialStudio/2.0',
        Accept: 'image/jpeg,image/png,image/webp,*/*',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    if (!arr || arr.byteLength < 4000) return null;
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

async function loadProductImageBuffer(imageUrl?: string): Promise<Buffer | null> {
  if (!imageUrl) return null;
  try {
    const cleaned = imageUrl.replace(/^https?:\/\/(www\.)?pekefe\.com/i, '');
    if (cleaned.startsWith('/')) {
      const rel = cleaned.split('?')[0].replace(/^\/api\/uploads\//, '/uploads/');
      const localPath = path.join(process.cwd(), 'public', rel);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const res = await fetch(imageUrl, { cache: 'no-store' });
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function buildBrandedComposite(params: {
  bgBuffer: Buffer;
  productBuffer: Buffer | null;
  width: number;
  height: number;
  productName: string;
  priceText: string;
  hookText: string;
  format: AiFormat;
}): Promise<Buffer> {
  const { width, height, productName, priceText, hookText, format } = params;
  const isLandscape = width > height;

  // 1. Prepare photorealistic AI background
  const baseBg = await sharp(params.bgBuffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  const composites: sharp.OverlayOptions[] = [];

  // 2. Subtle luxury scrim so text & real product pop cleanly
  const scrimSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#140609" stop-opacity="0.72"/>
          <stop offset="28%" stop-color="#140609" stop-opacity="0.18"/>
          <stop offset="62%" stop-color="#140609" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#140609" stop-opacity="0.88"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#topScrim)" />
    </svg>`;
  composites.push({ input: Buffer.from(scrimSvg), top: 0, left: 0 });

  // 3. Real authentic PEKEFE product card
  if (params.productBuffer) {
    const boxSize = isLandscape
      ? Math.round(height * 0.68)
      : format === 'ig-story'
        ? Math.round(width * 0.62)
        : Math.round(width * 0.52);

    const imgX = isLandscape
      ? Math.round(width - boxSize - 56)
      : Math.round((width - boxSize) / 2);
    const imgY = isLandscape
      ? Math.round((height - boxSize) / 2)
      : format === 'ig-story'
        ? Math.round(height * 0.25)
        : Math.round(height * 0.20);

    const roundedMask = Buffer.from(
      `<svg width="${boxSize}" height="${boxSize}"><rect x="0" y="0" width="${boxSize}" height="${boxSize}" rx="34" ry="34" fill="#fff"/></svg>`
    );

    const framedProduct = await sharp(params.productBuffer)
      .resize(boxSize, boxSize, { fit: 'cover', position: 'center' })
      .composite([{ input: roundedMask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    const frameBorderSvg = `
      <svg width="${boxSize + 24}" height="${boxSize + 24}" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="${boxSize + 16}" height="${boxSize + 16}" rx="40" ry="40" fill="rgba(255,255,255,0.12)" stroke="#fde68a" stroke-width="3" stroke-opacity="0.85"/>
      </svg>`;

    composites.push({ input: Buffer.from(frameBorderSvg), top: imgY - 12, left: imgX - 12 });
    composites.push({ input: framedProduct, top: imgY, left: imgX });
  }

  // 4. Razor-sharp PEKEFE Luxury Typography Overlay
  const titleLines = wrapLines(productName, isLandscape ? 22 : 24, 2);
  const hookLines = wrapLines(hookText, isLandscape ? 34 : 36, 2);

  let textSvg = '';
  if (isLandscape) {
    const leftX = 56;
    const titleY = Math.round(height * 0.34);
    textSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${leftX}" y="44" width="270" height="44" rx="22" fill="#6b1d2f" stroke="#fde68a" stroke-width="1.5"/>
        <text x="${leftX + 135}" y="72" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="800" fill="#fde68a" letter-spacing="2">PEKEFE · İSPİR</text>
        ${titleLines
          .map(
            (line, i) =>
              `<text x="${leftX}" y="${titleY + i * 54}" font-family="DejaVu Sans, Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff">${line}</text>`
          )
          .join('')}
        ${hookLines
          .map(
            (line, i) =>
              `<text x="${leftX}" y="${titleY + titleLines.length * 54 + 24 + i * 32}" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="500" fill="#f8fafc" fill-opacity="0.92">${line}</text>`
          )
          .join('')}
        <rect x="${leftX}" y="${height - 110}" width="210" height="58" rx="16" fill="#f59e0b"/>
        <text x="${leftX + 105}" y="${height - 73}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" font-weight="900" fill="#23070e">${escapeXml(priceText)}</text>
        <text x="${leftX + 234}" y="${height - 74}" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="700" fill="#fde68a">pekefe.com · %100 Doğal</text>
      </svg>`;
  } else {
    const centerX = Math.round(width / 2);
    const bottomTitleY = format === 'ig-story' ? Math.round(height * 0.67) : Math.round(height * 0.72);
    textSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${centerX - 165}" y="64" width="330" height="50" rx="25" fill="#6b1d2f" fill-opacity="0.92" stroke="#fde68a" stroke-width="2"/>
        <text x="${centerX}" y="96" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="800" fill="#fde68a" letter-spacing="3">PEKEFE · İSPİR 2014</text>
        ${titleLines
          .map(
            (line, i) =>
              `<text x="${centerX}" y="${bottomTitleY + i * 56}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="46" font-weight="900" fill="#ffffff">${line}</text>`
          )
          .join('')}
        ${hookLines
          .map(
            (line, i) =>
              `<text x="${centerX}" y="${bottomTitleY + titleLines.length * 56 + 18 + i * 34}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="500" fill="#f8fafc" fill-opacity="0.9">${line}</text>`
          )
          .join('')}
        <rect x="${centerX - 150}" y="${height - 155}" width="300" height="66" rx="33" fill="#f59e0b"/>
        <text x="${centerX}" y="${height - 112}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="900" fill="#23070e">${escapeXml(priceText)}</text>
        <text x="${centerX}" y="${height - 52}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="700" fill="#fde68a" letter-spacing="1.5">pekefe.com · %100 Katkısız &amp; Doğal</text>
      </svg>`;
  }

  composites.push({ input: Buffer.from(textSvg), top: 0, left: 0 });

  return sharp(baseBg).composite(composites).png({ compressionLevel: 7 }).toBuffer();
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const packId = String(body.packId || '');
    const format: AiFormat = FORMAT_SPECS[body.format as AiFormat] ? body.format : 'ig-post';
    const style: AiStyle = STYLE_PROMPTS[body.style as AiStyle] ? body.style : 'ispir-sunlight';
    const mode: 'branded' | 'scene-only' = body.mode === 'scene-only' ? 'scene-only' : 'branded';
    const engine: 'auto' | 'google' | 'flux' =
      body.engine === 'google' || body.engine === 'flux' ? body.engine : 'auto';
    const customPrompt = typeof body.customPrompt === 'string' ? body.customPrompt.trim() : '';

    const config = await getSocialMediaConfig();
    const pack = config.packs.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: 'İçerik paketi bulunamadı.' }, { status: 404 });
    }

    const spec = FORMAT_SPECS[format];
    const finalPrompt = await buildEnrichedPrompt({
      productName: pack.productName,
      productCategory: pack.productCategory || 'İspir Yöresel Ürünler',
      style,
      mode,
      customPrompt,
    });

    let rawImageBuffer: Buffer | null = null;
    let usedProvider: 'google-gemini' | 'google-imagen' | 'flux-free' = 'flux-free';

    if (engine === 'auto' || engine === 'google') {
      const googleRes = await generateWithGoogleGemini(finalPrompt);
      if (googleRes) {
        rawImageBuffer = googleRes.buffer;
        usedProvider = googleRes.provider;
      }
    }

    if (!rawImageBuffer && (engine === 'auto' || engine === 'flux')) {
      const fluxBuf = await generateWithFreeFlux(finalPrompt, spec.genW, spec.genH);
      if (fluxBuf) {
        rawImageBuffer = fluxBuf;
        usedProvider = 'flux-free';
      }
    }

    if (!rawImageBuffer) {
      return NextResponse.json(
        {
          error:
            'AI görsel servisi şu an yanıt vermedi. Lütfen birkaç saniye sonra tekrar deneyin veya hazır PEKEFE şablonlarını kullanın.',
        },
        { status: 503 }
      );
    }

    let finalPng: Buffer;
    if (mode === 'branded') {
      const productBuf = await loadProductImageBuffer(pack.productImage);
      const priceText =
        pack.productPrice > 0 ? `₺${Number(pack.productPrice).toLocaleString('tr-TR')}` : 'Taze Mahsul';
      finalPng = await buildBrandedComposite({
        bgBuffer: rawImageBuffer,
        productBuffer: productBuf,
        width: spec.width,
        height: spec.height,
        productName: pack.productName,
        priceText,
        hookText: pack.instagram?.post?.hook || "İspir Yaylası'ndan Sofranıza",
        format,
      });
    } else {
      finalPng = await sharp(rawImageBuffer)
        .resize(spec.width, spec.height, { fit: 'cover', position: 'center' })
        .png({ compressionLevel: 7 })
        .toBuffer();
    }

    const outDir = path.join(process.cwd(), 'public', 'uploads', 'social-ai');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const visualId = `aiv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const filename = `${visualId}-${format}.png`;
    fs.writeFileSync(path.join(outDir, filename), finalPng);

    const publicUrl = `/api/uploads/social-ai/${filename}`;
    const item: AiGeneratedVisualItem = {
      id: visualId,
      url: publicUrl,
      format,
      style,
      mode,
      provider: usedProvider,
      prompt: finalPrompt,
      createdAt: new Date().toISOString(),
    };

    const updatedPacks = config.packs.map((p) => {
      if (p.id !== pack.id) return p;
      return {
        ...p,
        aiGeneratedVisuals: [item, ...(p.aiGeneratedVisuals || [])].slice(0, 12),
      };
    });
    await saveSocialMediaConfig({ packs: updatedPacks });

    return NextResponse.json({
      success: true,
      visual: item,
    });
  } catch (error: any) {
    console.error('[AI VISUAL STUDIO ERROR]:', error);
    return NextResponse.json(
      { error: error?.message || 'AI görsel üretilirken hata oluştu.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const packId = searchParams.get('packId') || '';
    const visualId = searchParams.get('visualId') || '';
    if (!packId || !visualId) {
      return NextResponse.json({ error: 'packId ve visualId zorunludur.' }, { status: 400 });
    }

    const config = await getSocialMediaConfig();
    const pack = config.packs.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: 'Paket bulunamadı.' }, { status: 404 });
    }

    const target = (pack.aiGeneratedVisuals || []).find((v) => v.id === visualId);
    if (target?.url) {
      const filePart = target.url.split('/').pop();
      if (filePart && /^[a-zA-Z0-9_.-]+$/.test(filePart)) {
        const diskPath = path.join(process.cwd(), 'public', 'uploads', 'social-ai', filePart);
        if (fs.existsSync(diskPath)) {
          try {
            fs.unlinkSync(diskPath);
          } catch {}
        }
      }
    }

    const updatedPacks = config.packs.map((p) =>
      p.id === packId
        ? { ...p, aiGeneratedVisuals: (p.aiGeneratedVisuals || []).filter((v) => v.id !== visualId) }
        : p
    );
    await saveSocialMediaConfig({ packs: updatedPacks });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Silme hatası.' }, { status: 500 });
  }
}
