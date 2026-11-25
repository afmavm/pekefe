import { prisma, withTimeout } from '@/lib/prisma';
import { wrapPekefeEmail, PEKEFE_SITE_URL } from '@/lib/email-brand-layout';
import { emailNotificationService } from '@/lib/email-notification-service';
import { WhatsAppNotificationService } from '@/lib/whatsapp-service';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const INTEGRATION_ID = 'pekefe-retention-engine';
const LOCAL_STORE_PATH = path.join(process.cwd(), 'data', 'retention_engine.json');

export interface RetentionCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantLabel?: string;
}

export interface AbandonedCartRecord {
  id: string;
  sessionKey: string;
  customerName: string;
  email: string;
  phone: string;
  items: RetentionCartItem[];
  subtotal: number;
  status: 'active' | 'reminded' | 'recovered' | 'expired';
  createdAt: string;
  updatedAt: string;
  remindedAt?: string | null;
  recoveredAt?: string | null;
  recoveredOrderId?: string | null;
  reminderCount: number;
}

export interface RetentionDeliveryLog {
  id: string;
  type: 'abandoned_cart' | 'reorder' | 'test';
  channel: 'email' | 'whatsapp';
  recipient: string;
  customerName: string;
  status: 'sent' | 'failed' | 'skipped';
  detail?: string;
  createdAt: string;
}

export interface RetentionConfig {
  enabled: boolean;
  abandonedCartEnabled: boolean;
  abandonedCartDelayMinutes: number;
  abandonedCartCouponCode: string;
  abandonedCartDiscountText: string;
  reorderEnabled: boolean;
  reorderDelayDays: number;
  reorderMaxAgeDays: number;
  reorderCouponCode: string;
  reorderDiscountText: string;
  channels: {
    email: boolean;
    whatsapp: boolean;
  };
  cronSecret: string;
  lastCronRun: string | null;
  abandonedCarts: AbandonedCartRecord[];
  reorderedOrderIds: Record<string, { sentAt: string; customerName: string; email?: string; phone?: string }>;
  logs: RetentionDeliveryLog[];
}

function createDefaultConfig(): RetentionConfig {
  return {
    enabled: true,
    abandonedCartEnabled: true,
    abandonedCartDelayMinutes: 60,
    abandonedCartCouponCode: 'SEPET5',
    abandonedCartDiscountText: '%5 Sepet Hatırlatma İndirimi',
    reorderEnabled: true,
    reorderDelayDays: 28,
    reorderMaxAgeDays: 90,
    reorderCouponCode: 'TEKRAR10',
    reorderDiscountText: '%10 Sadakat İndirimi',
    channels: {
      email: true,
      whatsapp: true,
    },
    cronSecret: crypto.randomBytes(16).toString('hex'),
    lastCronRun: null,
    abandonedCarts: [],
    reorderedOrderIds: {},
    logs: [],
  };
}

function readLocalStore(): Partial<RetentionConfig> | null {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf-8'));
    }
  } catch {}
  return null;
}

function writeLocalStore(cfg: RetentionConfig): void {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[RETENTION] Local store write error:', err);
  }
}

async function persistRetentionConfig(next: RetentionConfig): Promise<void> {
  writeLocalStore(next);

  try {
    await withTimeout(
      prisma.integration.upsert({
        where: { id: INTEGRATION_ID },
        update: {
          status: next.enabled ? 'active' : 'paused',
          lastSync: next.lastCronRun,
          settings: next as any,
        },
        create: {
          id: INTEGRATION_ID,
          name: 'PEKEFE Retention Engine',
          type: 'retention',
          status: next.enabled ? 'active' : 'paused',
          lastSync: next.lastCronRun,
          logo: 'retention',
          settings: next as any,
        },
      }),
      2000,
      null
    );
  } catch (err) {
    console.warn('[RETENTION] DB save warning:', err);
  }
}

export async function getRetentionConfig(): Promise<RetentionConfig> {
  const defaults = createDefaultConfig();
  let dbData: Partial<RetentionConfig> | null = null;

  try {
    const row = await withTimeout(
      prisma.integration.findUnique({ where: { id: INTEGRATION_ID } }),
      1500,
      null
    );
    if (row?.settings && typeof row.settings === 'object') {
      dbData = row.settings as Partial<RetentionConfig>;
    }
  } catch {}

  const localData = readLocalStore();
  const merged: RetentionConfig = {
    ...defaults,
    ...(localData || {}),
    ...(dbData || {}),
    channels: {
      ...defaults.channels,
      ...(localData?.channels || {}),
      ...(dbData?.channels || {}),
    },
    abandonedCarts: Array.isArray(dbData?.abandonedCarts)
      ? dbData!.abandonedCarts
      : Array.isArray(localData?.abandonedCarts)
        ? localData!.abandonedCarts
        : [],
    reorderedOrderIds: {
      ...(localData?.reorderedOrderIds || {}),
      ...(dbData?.reorderedOrderIds || {}),
    },
    logs: Array.isArray(dbData?.logs)
      ? dbData!.logs
      : Array.isArray(localData?.logs)
        ? localData!.logs
        : [],
  };

  // Persist newly generated cronSecret directly without re-entering getRetentionConfig
  if (!dbData?.cronSecret && !localData?.cronSecret) {
    await persistRetentionConfig(merged).catch(() => {});
  }

  return merged;
}

export async function saveRetentionConfig(
  patch: Partial<RetentionConfig>
): Promise<RetentionConfig> {
  const current = await getRetentionConfig();
  const next: RetentionConfig = {
    ...current,
    ...patch,
    channels: patch.channels ? { ...current.channels, ...patch.channels } : current.channels,
    abandonedCarts: (patch.abandonedCarts ?? current.abandonedCarts).slice(0, 200),
    reorderedOrderIds: patch.reorderedOrderIds ?? current.reorderedOrderIds,
    logs: (patch.logs ?? current.logs).slice(0, 150),
  };

  await persistRetentionConfig(next);
  return next;
}

function normalizePhoneTr(raw?: string | null): string {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '9' + digits;
  else if (digits.length === 10 && digits.startsWith('5')) digits = '90' + digits;
  return digits.length >= 11 ? `+${digits}` : '';
}

export function buildWhatsAppWebUrl(phone: string, text: string): string {
  const digits = normalizePhoneTr(phone).replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function formatPriceTr(val: number): string {
  return `₺${Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Terk Edilen Sepet yakalama / guncelleme
 */
export async function upsertAbandonedCart(input: {
  sessionKey?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  items: RetentionCartItem[];
  subtotal: number;
}): Promise<AbandonedCartRecord | null> {
  const cleanEmail = String(input.email || '').trim().toLowerCase();
  const cleanPhone = normalizePhoneTr(input.phone);
  if (!cleanEmail && !cleanPhone) return null;
  if (!Array.isArray(input.items) || input.items.length === 0) return null;

  const config = await getRetentionConfig();
  const key = (input.sessionKey || cleanEmail || cleanPhone).toLowerCase();
  const nowIso = new Date().toISOString();

  const carts = [...config.abandonedCarts];
  const existingIdx = carts.findIndex(
    (c) =>
      c.status !== 'recovered' &&
      (c.sessionKey === key ||
        (cleanEmail && c.email === cleanEmail) ||
        (cleanPhone && c.phone === cleanPhone))
  );

  let record: AbandonedCartRecord;
  if (existingIdx >= 0) {
    const prev = carts[existingIdx];
    record = {
      ...prev,
      customerName: input.customerName?.trim() || prev.customerName || 'Değerli Müşterimiz',
      email: cleanEmail || prev.email,
      phone: cleanPhone || prev.phone,
      items: input.items.slice(0, 15),
      subtotal: Number(input.subtotal || 0),
      updatedAt: nowIso,
    };
    carts[existingIdx] = record;
  } else {
    record = {
      id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionKey: key,
      customerName: input.customerName?.trim() || 'Değerli Müşterimiz',
      email: cleanEmail,
      phone: cleanPhone,
      items: input.items.slice(0, 15),
      subtotal: Number(input.subtotal || 0),
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
      remindedAt: null,
      recoveredAt: null,
      recoveredOrderId: null,
      reminderCount: 0,
    };
    carts.unshift(record);
  }

  await saveRetentionConfig({ abandonedCarts: carts });
  return record;
}

/**
 * Siparis tamamlandiginda sepeti "recovered" (kurtarildi) olarak isaretler.
 */
export async function markAbandonedCartRecovered(input: {
  email?: string;
  phone?: string;
  orderId?: string;
}): Promise<boolean> {
  const cleanEmail = String(input.email || '').trim().toLowerCase();
  const cleanPhone = normalizePhoneTr(input.phone);
  if (!cleanEmail && !cleanPhone) return false;

  const config = await getRetentionConfig();
  let matched = false;
  const nowIso = new Date().toISOString();

  const updated = config.abandonedCarts.map((c) => {
    if (
      c.status !== 'recovered' &&
      ((cleanEmail && c.email === cleanEmail) || (cleanPhone && c.phone === cleanPhone))
    ) {
      matched = true;
      return {
        ...c,
        status: 'recovered' as const,
        recoveredAt: nowIso,
        recoveredOrderId: input.orderId || null,
        updatedAt: nowIso,
      };
    }
    return c;
  });

  if (matched) {
    await saveRetentionConfig({ abandonedCarts: updated });
  }
  return matched;
}

/**
 * Terk edilen sepet icin luks PEKEFE HTML e-posta + WhatsApp metni uretir.
 */
export function buildAbandonedCartMessages(
  cart: AbandonedCartRecord,
  config: RetentionConfig
): { subject: string; emailHtml: string; whatsappText: string } {
  const firstName = (cart.customerName || 'Değerli Müşterimiz').split(' ')[0];
  const couponParam = config.abandonedCartCouponCode
    ? `&coupon=${encodeURIComponent(config.abandonedCartCouponCode)}`
    : '';
  const recoveryUrl = `${PEKEFE_SITE_URL}/sepet?recover=${encodeURIComponent(cart.id)}${couponParam}&utm_source=retention&utm_medium=email&utm_campaign=abandoned_cart`;
  const waUrl = `${PEKEFE_SITE_URL}/sepet?recover=${encodeURIComponent(cart.id)}${couponParam}&utm_source=retention&utm_medium=whatsapp&utm_campaign=abandoned_cart`;

  const itemsRows = cart.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1e8e3;font-size:13px;color:#1e293b;font-weight:600;">
          ${item.name}${item.variantLabel ? ` <span style="color:#64748b;font-weight:400;">(${item.variantLabel})</span>` : ''}
        </td>
        <td align="center" style="padding:10px 8px;border-bottom:1px solid #f1e8e3;font-size:13px;color:#475569;">${item.quantity}</td>
        <td align="right" style="padding:10px 12px;border-bottom:1px solid #f1e8e3;font-size:13px;color:#6b1d2f;font-weight:700;">${formatPriceTr(item.price * item.quantity)}</td>
      </tr>`
    )
    .join('');

  const couponBlock = config.abandonedCartCouponCode
    ? `<div style="margin:20px 0;padding:16px;border-radius:14px;background-color:#fffbeb;border:1.5px dashed #d97706;text-align:center;">
        <div style="font-size:11px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:0.1em;">SEPETİNİZE ÖZEL HEDİYE</div>
        <div style="font-size:20px;font-weight:900;color:#6b1d2f;letter-spacing:0.12em;margin:6px 0;">${config.abandonedCartCouponCode}</div>
        <div style="font-size:12px;color:#78350f;">${config.abandonedCartDiscountText || 'Sepette geçerli özel indirim'}</div>
      </div>`
    : '';

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#334155;">
      Merhaba <strong>${firstName}</strong>,
    </p>
    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#475569;">
      İspir yaylalarından seçtiğiniz doğal lezzetleri sepetinizde sizin için hazır beklettik. Siparişinizi tek tıkla tamamlayabilir, taze üretim ürünlerimizi sofranıza güvenle ulaştırabilirsiniz.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #ece3de;border-radius:12px;overflow:hidden;margin-bottom:14px;">
      <thead>
        <tr style="background-color:#faf6f4;">
          <th align="left" style="padding:10px 12px;font-size:11px;color:#64748b;text-transform:uppercase;">Ürün</th>
          <th align="center" style="padding:10px 8px;font-size:11px;color:#64748b;text-transform:uppercase;">Adet</th>
          <th align="right" style="padding:10px 12px;font-size:11px;color:#64748b;text-transform:uppercase;">Tutar</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
      <tfoot>
        <tr style="background-color:#faf6f4;">
          <td colspan="2" align="right" style="padding:11px 12px;font-size:13px;font-weight:700;color:#1e293b;">Sepet Toplamı</td>
          <td align="right" style="padding:11px 12px;font-size:15px;font-weight:900;color:#6b1d2f;">${formatPriceTr(cart.subtotal)}</td>
        </tr>
      </tfoot>
    </table>
    ${couponBlock}
  `;

  const emailHtml = wrapPekefeEmail({
    badge: 'SEPETİNİZ SİZİ BEKLİYOR',
    title: 'Seçtiğiniz İspir Lezzetleri Hazır!',
    bodyHtml,
    ctaText: 'Sepetime Dön & Siparişi Tamamla →',
    ctaUrl: recoveryUrl,
  });

  const itemSummary = cart.items.map((i) => `• ${i.name} (${i.quantity} adet)`).join('\n');
  const whatsappText = [
    `Merhaba ${firstName} 👋`,
    `PEKEFE sepetinizde bekleyen doğal İspir lezzetleriniz var:`,
    itemSummary,
    `Toplam: ${formatPriceTr(cart.subtotal)}`,
    config.abandonedCartCouponCode
      ? `🎁 Özel Kodunuz: *${config.abandonedCartCouponCode}* (${config.abandonedCartDiscountText})`
      : '',
    `Siparişinizi hemen tamamlamak için: ${waUrl}`,
    `_PEKEFE İspir Yöresel Ürünler_`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    subject: `${firstName}, PEKEFE sepetinizdeki doğal İspir lezzetleri sizi bekliyor!`,
    emailHtml,
    whatsappText,
  };
}

/**
 * 25-30. gun Tekrar Siparis (Reorder) e-posta + WhatsApp metni uretir.
 */
export function buildReorderMessages(
  order: {
    orderId: string;
    customerName: string;
    itemsSummary: string;
    daysAgo: number;
  },
  config: RetentionConfig
): { subject: string; emailHtml: string; whatsappText: string } {
  const firstName = (order.customerName || 'Değerli Müşterimiz').split(' ')[0];
  const shopUrl = `${PEKEFE_SITE_URL}/kategoriler?utm_source=retention&utm_medium=email&utm_campaign=reorder_${config.reorderDelayDays}d`;
  const waShopUrl = `${PEKEFE_SITE_URL}/kategoriler?utm_source=retention&utm_medium=whatsapp&utm_campaign=reorder_${config.reorderDelayDays}d`;

  const couponBlock = config.reorderCouponCode
    ? `<div style="margin:20px 0;padding:18px;border-radius:14px;background-color:#fdf8f6;border:1.5px dashed #6b1d2f;text-align:center;">
        <div style="font-size:11px;font-weight:800;color:#6b1d2f;text-transform:uppercase;letter-spacing:0.1em;">SADAKAT HEDİYENİZ</div>
        <div style="font-size:22px;font-weight:900;color:#6b1d2f;letter-spacing:0.14em;margin:6px 0;">${config.reorderCouponCode}</div>
        <div style="font-size:12px;color:#475569;">${config.reorderDiscountText || 'Tekrar siparişinize özel indirim'}</div>
      </div>`
    : '';

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#334155;">
      Merhaba <strong>${firstName}</strong>,
    </p>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.7;color:#475569;">
      Son PEKEFE siparişinizin üzerinden <strong>${order.daysAgo} gün</strong> geçti. İspir yaylalarından sofranıza ulaşan doğal lezzetleriniz tükenmek üzere olabilir!
    </p>
    ${
      order.itemsSummary
        ? `<div style="padding:14px 16px;background-color:#faf6f4;border-radius:12px;border:1px solid #ece3de;margin:16px 0;font-size:13px;color:#334155;">
            <strong style="color:#6b1d2f;">Önceki Siparişiniz:</strong><br/>${order.itemsSummary}
          </div>`
        : ''
    }
    <p style="margin:0 0 14px 0;font-size:14px;line-height:1.7;color:#475569;">
      Taze üretim <strong>İspir Dut Gün Pekmezi, Yaprak Dut Pestili ve Cevizli Köme</strong> stoklarımız yenilendi. Şifa dolu sofranız eksik kalmasın diye size özel bir hatırlatma göndermek istedik.
    </p>
    ${couponBlock}
  `;

  const emailHtml = wrapPekefeEmail({
    badge: 'TAZE MAHSUL HATIRLATMASI',
    title: 'İspir Lezzetleriniz Bitiyor Olabilir!',
    bodyHtml,
    ctaText: 'Taze Ürünleri Yeniden Sipariş Ver →',
    ctaUrl: shopUrl,
  });

  const whatsappText = [
    `Merhaba ${firstName} 🌿`,
    `Son PEKEFE siparişinizin üzerinden ${order.daysAgo} gün geçti. Doğal İspir dut pekmezi, pestil ve cevizli kömeleriniz tükenmek üzere olabilir!`,
    order.itemsSummary ? `Önceki siparişiniz: ${order.itemsSummary}` : '',
    config.reorderCouponCode
      ? `🎁 Size Özel Sadakat Kodunuz: *${config.reorderCouponCode}* (${config.reorderDiscountText})`
      : '',
    `Hemen yeniden sipariş vermek için: ${waShopUrl}`,
    `_PEKEFE İspir Yöresel Ürünler_`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    subject: `${firstName}, İspir Dut Pekmezi & Pestiliniz bitiyor olabilir — Taze stoklar hazır!`,
    emailHtml,
    whatsappText,
  };
}

export interface ReorderCandidate {
  orderId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  itemsSummary: string;
  orderDate: string;
  daysAgo: number;
  alreadySent: boolean;
  sentAt: string | null;
}

/**
 * Veritabanindaki gercek siparislerden 25-30+ gunluk tekrar siparis adaylarini bulur.
 */
export async function getReorderCandidates(config?: RetentionConfig): Promise<ReorderCandidate[]> {
  const cfg = config || (await getRetentionConfig());
  const now = Date.now();
  const minMs = Math.max(1, cfg.reorderDelayDays) * 24 * 60 * 60 * 1000;
  const maxMs = Math.max(cfg.reorderDelayDays + 5, cfg.reorderMaxAgeDays || 90) * 24 * 60 * 60 * 1000;

  let orders: any[] = [];
  try {
    orders = await withTimeout(
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 250,
      }),
      2000,
      []
    );
  } catch (err) {
    console.warn('[RETENTION] Orders query fallback:', err);
    return [];
  }

  // Group by customer email/phone to keep only their LATEST order
  const latestByCustomer = new Map<string, any>();
  for (const o of orders) {
    const statusLower = String(o.status || '').toLowerCase();
    if (statusLower.includes('iptal') || statusLower.includes('cancel') || statusLower.includes('iade')) {
      continue;
    }
    const email = String(o.customerEmail || o.email || '').trim().toLowerCase();
    const phone = normalizePhoneTr(o.customerPhone || o.phone || '');
    const key = email || phone;
    if (!key) continue;
    if (!latestByCustomer.has(key)) {
      latestByCustomer.set(key, { ...o, _email: email, _phone: phone });
    }
  }

  const candidates: ReorderCandidate[] = [];
  for (const [, o] of latestByCustomer.entries()) {
    const createdMs = new Date(o.createdAt).getTime();
    if (!Number.isFinite(createdMs)) continue;
    const ageMs = now - createdMs;
    if (ageMs < minMs || ageMs > maxMs) continue;

    let itemsArr: any[] = [];
    if (Array.isArray(o.items)) itemsArr = o.items;
    else if (typeof o.items === 'string') {
      try {
        itemsArr = JSON.parse(o.items);
      } catch {}
    }
    const itemsSummary = itemsArr
      .slice(0, 4)
      .map((i: any) => `${i.name || i.title || 'Ürün'} (${i.quantity || i.qty || 1} adet)`)
      .join(', ');

    const orderId = String(o.id);
    const sentInfo = cfg.reorderedOrderIds?.[orderId];

    candidates.push({
      orderId,
      orderNumber: String(o.orderNumber || o.id),
      customerName: String(o.customerName || o.client || 'PEKEFE Müşterisi'),
      email: o._email,
      phone: o._phone,
      total: Number(o.total || o.amount || 0),
      itemsSummary,
      orderDate: new Date(o.createdAt).toISOString(),
      daysAgo: Math.floor(ageMs / (24 * 60 * 60 * 1000)),
      alreadySent: Boolean(sentInfo),
      sentAt: sentInfo?.sentAt || null,
    });
  }

  return candidates.sort((a, b) => b.daysAgo - a.daysAgo);
}

/**
 * Tek bir terk edilen sepet icin e-posta + WhatsApp hatirlatmasi gonderir.
 */
export async function sendAbandonedCartReminder(
  cartId: string,
  options: { force?: boolean } = {}
): Promise<{ sent: boolean; emailOk: boolean; whatsappOk: boolean; error?: string }> {
  const config = await getRetentionConfig();
  const cartIdx = config.abandonedCarts.findIndex((c) => c.id === cartId);
  if (cartIdx < 0) {
    return { sent: false, emailOk: false, whatsappOk: false, error: 'Sepet kaydı bulunamadı.' };
  }

  const cart = config.abandonedCarts[cartIdx];
  if (!options.force && (cart.status === 'recovered' || cart.status === 'reminded')) {
    return { sent: false, emailOk: false, whatsappOk: false, error: 'Bu sepet zaten işlenmiş.' };
  }

  const { subject, emailHtml, whatsappText } = buildAbandonedCartMessages(cart, config);
  const logs = [...config.logs];
  const nowIso = new Date().toISOString();

  let emailOk = false;
  let whatsappOk = false;

  if (config.channels.email && cart.email) {
    const res = await emailNotificationService.sendCustomHtmlEmail(
      cart.email,
      subject,
      emailHtml,
      'ABANDONED_CART'
    );
    emailOk = res.success;
    logs.unshift({
      id: `log-${Date.now()}-e`,
      type: 'abandoned_cart',
      channel: 'email',
      recipient: cart.email,
      customerName: cart.customerName,
      status: res.success ? 'sent' : 'failed',
      detail: res.error || subject,
      createdAt: nowIso,
    });
  }

  if (config.channels.whatsapp && cart.phone) {
    const waRes = await WhatsAppNotificationService.sendWhatsApp(cart.phone, whatsappText);
    whatsappOk = waRes.success;
    logs.unshift({
      id: `log-${Date.now()}-w`,
      type: 'abandoned_cart',
      channel: 'whatsapp',
      recipient: cart.phone,
      customerName: cart.customerName,
      status: waRes.success ? 'sent' : 'skipped',
      detail: waRes.error || `Provider: ${waRes.provider}`,
      createdAt: nowIso,
    });
  }

  const sent = emailOk || whatsappOk;
  const updatedCarts = [...config.abandonedCarts];
  if (sent) {
    updatedCarts[cartIdx] = {
      ...cart,
      status: 'reminded',
      remindedAt: nowIso,
      reminderCount: (cart.reminderCount || 0) + 1,
      updatedAt: nowIso,
    };
  }

  await saveRetentionConfig({ abandonedCarts: updatedCarts, logs });
  return {
    sent,
    emailOk,
    whatsappOk,
    error: sent ? undefined : 'E-posta veya WhatsApp gönderimi yapılamadı (SMTP/WhatsApp ayarlarını kontrol edin).',
  };
}

/**
 * Tek bir gecmis siparis icin 25-30. gun tekrar siparis hatirlatmasi gonderir.
 */
export async function sendReorderReminder(
  candidate: ReorderCandidate
): Promise<{ sent: boolean; emailOk: boolean; whatsappOk: boolean; error?: string }> {
  const config = await getRetentionConfig();
  const { subject, emailHtml, whatsappText } = buildReorderMessages(candidate, config);
  const logs = [...config.logs];
  const nowIso = new Date().toISOString();

  let emailOk = false;
  let whatsappOk = false;

  if (config.channels.email && candidate.email) {
    const res = await emailNotificationService.sendCustomHtmlEmail(
      candidate.email,
      subject,
      emailHtml,
      'REORDER_REMINDER'
    );
    emailOk = res.success;
    logs.unshift({
      id: `log-${Date.now()}-re`,
      type: 'reorder',
      channel: 'email',
      recipient: candidate.email,
      customerName: candidate.customerName,
      status: res.success ? 'sent' : 'failed',
      detail: res.error || `Sipariş #${candidate.orderNumber}`,
      createdAt: nowIso,
    });
  }

  if (config.channels.whatsapp && candidate.phone) {
    const waRes = await WhatsAppNotificationService.sendWhatsApp(candidate.phone, whatsappText);
    whatsappOk = waRes.success;
    logs.unshift({
      id: `log-${Date.now()}-rw`,
      type: 'reorder',
      channel: 'whatsapp',
      recipient: candidate.phone,
      customerName: candidate.customerName,
      status: waRes.success ? 'sent' : 'skipped',
      detail: waRes.error || `Provider: ${waRes.provider}`,
      createdAt: nowIso,
    });
  }

  const sent = emailOk || whatsappOk;
  const nextReordered = { ...config.reorderedOrderIds };
  if (sent) {
    nextReordered[candidate.orderId] = {
      sentAt: nowIso,
      customerName: candidate.customerName,
      email: candidate.email,
      phone: candidate.phone,
    };
  }

  await saveRetentionConfig({ reorderedOrderIds: nextReordered, logs });
  return {
    sent,
    emailOk,
    whatsappOk,
    error: sent ? undefined : 'E-posta veya WhatsApp gönderimi yapılamadı.',
  };
}

/**
 * Otomatik Retention Cron Dongusu:
 * 1) Suresi dolan terk edilmis sepetlere otomatik hatirlatma gonderir.
 * 2) 25-30+ gun once siparis veren musterilere tekrar siparis hatirlatmasi gonderir.
 */
export async function runRetentionCycle(): Promise<{
  skipped?: boolean;
  abandonedProcessed: number;
  abandonedSent: number;
  reorderProcessed: number;
  reorderSent: number;
  ranAt: string;
}> {
  const config = await getRetentionConfig();
  const nowIso = new Date().toISOString();

  if (!config.enabled) {
    return {
      skipped: true,
      abandonedProcessed: 0,
      abandonedSent: 0,
      reorderProcessed: 0,
      reorderSent: 0,
      ranAt: nowIso,
    };
  }

  let abandonedProcessed = 0;
  let abandonedSent = 0;
  let reorderProcessed = 0;
  let reorderSent = 0;

  // 1. Abandoned Carts
  if (config.abandonedCartEnabled) {
    const delayMs = Math.max(5, config.abandonedCartDelayMinutes || 60) * 60 * 1000;
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // Do not spam carts older than 7 days
    const now = Date.now();

    const dueCarts = config.abandonedCarts.filter((c) => {
      if (c.status !== 'active') return false;
      const age = now - new Date(c.updatedAt || c.createdAt).getTime();
      return age >= delayMs && age <= maxAgeMs;
    });

    for (const cart of dueCarts.slice(0, 20)) {
      abandonedProcessed++;
      const res = await sendAbandonedCartReminder(cart.id);
      if (res.sent) abandonedSent++;
    }
  }

  // 2. Post-Purchase Reorder Reminders (25-30 days)
  if (config.reorderEnabled) {
    const candidates = await getReorderCandidates(config);
    const dueCandidates = candidates.filter((c) => !c.alreadySent);

    for (const cand of dueCandidates.slice(0, 20)) {
      reorderProcessed++;
      const res = await sendReorderReminder(cand);
      if (res.sent) reorderSent++;
    }
  }

  await saveRetentionConfig({ lastCronRun: nowIso });

  return {
    abandonedProcessed,
    abandonedSent,
    reorderProcessed,
    reorderSent,
    ranAt: nowIso,
  };
}
