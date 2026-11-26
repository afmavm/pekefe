import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import {
  buildAbandonedCartMessages,
  buildReorderMessages,
  buildWhatsAppWebUrl,
  getReorderCandidates,
  getRetentionConfig,
  runRetentionCycle,
  saveRetentionConfig,
  sendAbandonedCartReminder,
  sendReorderReminder,
} from '@/lib/retention-service';
import { emailNotificationService } from '@/lib/email-notification-service';
import { getPublishedProductsServer } from '@/lib/category-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/retention
 * Admin paneli icin tum retention KPI'lari, terk edilmis sepetler, tekrar siparis adaylari ve loglari doner.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const config = await getRetentionConfig();
    const reorderCandidates = await getReorderCandidates(config);

    // Hatirlatma gonderilmeden normal tamamlanmis eski "recovered" kayitlarini temizle (gercek attribution)
    const cleanedCarts = config.abandonedCarts.filter(
      (c) => !(c.status === 'recovered' && (c.reminderCount || 0) === 0 && !c.remindedAt)
    );
    if (cleanedCarts.length !== config.abandonedCarts.length) {
      await saveRetentionConfig({ abandonedCarts: cleanedCarts }).catch(() => {});
    }

    const abandonedCarts = cleanedCarts.map((cart) => {
      const { whatsappText } = buildAbandonedCartMessages(cart, config);
      return {
        ...cart,
        whatsappWebUrl: buildWhatsAppWebUrl(cart.phone, whatsappText),
      };
    });

    const enrichedCandidates = reorderCandidates.map((cand) => {
      const { whatsappText } = buildReorderMessages(cand, config);
      return {
        ...cand,
        whatsappWebUrl: buildWhatsAppWebUrl(cand.phone, whatsappText),
      };
    });

    const recoveredCarts = cleanedCarts.filter(
      (c) => c.status === 'recovered' && ((c.reminderCount || 0) > 0 || Boolean(c.remindedAt))
    );
    const remindedCarts = cleanedCarts.filter((c) => (c.reminderCount || 0) > 0 || Boolean(c.remindedAt));
    const activeCarts = cleanedCarts.filter((c) => c.status === 'active');

    const kpis = {
      activeAbandoned: activeCarts.length,
      totalAbandoned: cleanedCarts.length,
      remindedCount: remindedCarts.length,
      recoveredCount: recoveredCarts.length,
      recoveredRevenue: recoveredCarts.reduce((acc, c) => acc + Number(c.subtotal || 0), 0),
      pendingReorders: enrichedCandidates.filter((c) => !c.alreadySent).length,
      sentReorders: Object.keys(config.reorderedOrderIds || {}).length,
    };

    const cronUrl = `https://www.pekefe.com/api/retention/cron?key=${config.cronSecret}`;

    return NextResponse.json({
      settings: {
        enabled: config.enabled,
        abandonedCartEnabled: config.abandonedCartEnabled,
        abandonedCartDelayMinutes: config.abandonedCartDelayMinutes,
        abandonedCartCouponCode: config.abandonedCartCouponCode,
        abandonedCartDiscountText: config.abandonedCartDiscountText,
        reorderEnabled: config.reorderEnabled,
        reorderDelayDays: config.reorderDelayDays,
        reorderMaxAgeDays: config.reorderMaxAgeDays,
        reorderCouponCode: config.reorderCouponCode,
        reorderDiscountText: config.reorderDiscountText,
        channels: config.channels,
        lastCronRun: config.lastCronRun,
        cronUrl,
      },
      kpis,
      abandonedCarts,
      reorderCandidates: enrichedCandidates,
      logs: config.logs.slice(0, 60),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Retention verileri alınamadı.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/retention
 * Actions: save | run-now | send-abandoned | send-reorder | send-test | delete-cart
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'save';

    if (action === 'run-now') {
      const result = await runRetentionCycle();
      return NextResponse.json({ success: true, result });
    }

    if (action === 'send-abandoned') {
      if (!body.cartId) {
        return NextResponse.json({ error: 'Sepet ID zorunludur.' }, { status: 400 });
      }
      const res = await sendAbandonedCartReminder(String(body.cartId), { force: true });
      return NextResponse.json({ success: res.sent, ...res });
    }

    if (action === 'send-reorder') {
      if (!body.orderId) {
        return NextResponse.json({ error: 'Sipariş ID zorunludur.' }, { status: 400 });
      }
      const config = await getRetentionConfig();
      const candidates = await getReorderCandidates(config);
      const target = candidates.find((c) => c.orderId === String(body.orderId));
      if (!target) {
        return NextResponse.json({ error: 'Sipariş adayı bulunamadı.' }, { status: 404 });
      }
      const res = await sendReorderReminder(target);
      return NextResponse.json({ success: res.sent, ...res });
    }

    if (action === 'delete-cart') {
      const config = await getRetentionConfig();
      const filtered = config.abandonedCarts.filter((c) => c.id !== String(body.cartId));
      await saveRetentionConfig({ abandonedCarts: filtered });
      return NextResponse.json({ success: true });
    }

    if (action === 'send-test') {
      const email = String(body.email || '').trim();
      const templateType = body.templateType === 'reorder' ? 'reorder' : 'abandoned_cart';
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Geçerli bir test e-posta adresi girin.' }, { status: 400 });
      }
      const config = await getRetentionConfig();
      const liveProducts = await getPublishedProductsServer().catch(() => []);
      const testItems =
        liveProducts.length > 0
          ? liveProducts.slice(0, 2).map((p: any) => ({
              id: String(p.id),
              name: String(p.name || 'PEKEFE Ürün'),
              price: Number(p.price || 0),
              quantity: 1,
              image: p.image || '/pekefe-dut-pekmezi-kavanoz-tr.jpg',
            }))
          : [
              { id: '1', name: 'PEKEFE İspir Dut Pekmezi', price: 690, quantity: 1 },
              { id: '2', name: 'PEKEFE Cevizli Dut Pestili', price: 490, quantity: 1 },
            ];
      const testSubtotal = testItems.reduce((acc: number, i: any) => acc + i.price * i.quantity, 0);

      const msg =
        templateType === 'reorder'
          ? buildReorderMessages(
              {
                orderId: 'TEST-1001',
                customerName: 'Değerli Müşterimiz',
                itemsSummary: testItems.map((i: any) => `${i.name} (1 adet)`).join(', '),
                daysAgo: config.reorderDelayDays || 28,
              },
              config
            )
          : buildAbandonedCartMessages(
              {
                id: 'test-cart',
                sessionKey: 'test',
                customerName: 'Değerli Müşterimiz',
                email,
                phone: '',
                subtotal: testSubtotal,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                reminderCount: 0,
                items: testItems,
              },
              config
            );

      const res = await emailNotificationService.sendCustomHtmlEmail(
        email,
        `[TEST] ${msg.subject}`,
        msg.emailHtml,
        'RETENTION_TEST'
      );
      return NextResponse.json({ success: res.success, error: res.error });
    }

    // Default: save settings
    const patch: Record<string, any> = {};
    if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
    if (typeof body.abandonedCartEnabled === 'boolean') patch.abandonedCartEnabled = body.abandonedCartEnabled;
    if (body.abandonedCartDelayMinutes != null) {
      patch.abandonedCartDelayMinutes = Math.max(5, Math.min(1440, Number(body.abandonedCartDelayMinutes) || 60));
    }
    if (typeof body.abandonedCartCouponCode === 'string') {
      patch.abandonedCartCouponCode = body.abandonedCartCouponCode.trim().toUpperCase();
    }
    if (typeof body.abandonedCartDiscountText === 'string') {
      patch.abandonedCartDiscountText = body.abandonedCartDiscountText.trim();
    }
    if (typeof body.reorderEnabled === 'boolean') patch.reorderEnabled = body.reorderEnabled;
    if (body.reorderDelayDays != null) {
      patch.reorderDelayDays = Math.max(7, Math.min(120, Number(body.reorderDelayDays) || 28));
    }
    if (body.reorderMaxAgeDays != null) {
      patch.reorderMaxAgeDays = Math.max(30, Math.min(365, Number(body.reorderMaxAgeDays) || 90));
    }
    if (typeof body.reorderCouponCode === 'string') {
      patch.reorderCouponCode = body.reorderCouponCode.trim().toUpperCase();
    }
    if (typeof body.reorderDiscountText === 'string') {
      patch.reorderDiscountText = body.reorderDiscountText.trim();
    }
    if (body.channels && typeof body.channels === 'object') {
      patch.channels = {
        email: Boolean(body.channels.email),
        whatsapp: Boolean(body.channels.whatsapp),
      };
    }

    await saveRetentionConfig(patch);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Retention işlemi başarısız.' },
      { status: 500 }
    );
  }
}
