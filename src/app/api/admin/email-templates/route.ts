import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

// Common HTML Layout for Email Fallbacks
const baseLayout = (content: string) => `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Pekefe Geleneksel Lezzetler</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #333; margin: 0; padding: 0; }
  .wrapper { max-width: 620px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #f1f5f9; }
  .header { background: linear-gradient(135deg, #b45309 0%, #78350f 100%); padding: 36px 40px; text-align: center; color: #fff; }
  .body { padding: 36px 40px; }
  .btn { display: inline-block; padding: 14px 36px; background: #b45309; color: #fff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin: 12px 0; }
  .footer { background: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 11px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1 style="margin:0;font-size:24px;">🌿 PEKEFE</h1>
    <p style="margin:6px 0 0;font-size:12px;color:#fef3c7;">Geleneksel &amp; Doğal Lezzetler · İspir</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>&copy; 2026 Pekefe Geleneksel Lezzetler. Tüm Hakları Saklıdır.</p>
  </div>
</div>
</body>
</html>`;

const FALLBACK_TEMPLATES = [
  {
    eventType: 'WELCOME',
    name: 'Hoş Geldiniz - Yeni Üyelik',
    subject: "Pekefe Ailesine Hoş Geldiniz, {{userName}}! 🌿",
    variables: 'userName,userEmail,loginUrl,recipientEmail',
    status: 'ACTIVE',
    bodyHtml: baseLayout(`<h2>Aramıza Hoş Geldiniz, {{userName}}! ✨</h2><p>Pekefe ailesine katıldığınız için teşekkür ederiz. Hesabınız başarıyla oluşturulmuştur.</p><a href="{{loginUrl}}" class="btn">Alışverişe Başla &rarr;</a>`)
  },
  {
    eventType: 'PASSWORD_RESET',
    name: 'Şifre Sıfırlama İsteği',
    subject: 'Şifrenizi Sıfırlayın — Pekefe',
    variables: 'userName,resetUrl,expiresIn,recipientEmail',
    status: 'ACTIVE',
    bodyHtml: baseLayout(`<h2>Şifre Sıfırlama Talebi</h2><p>Merhaba <strong>{{userName}}</strong>,</p><p>Hesabınız için şifre sıfırlama talebinde bulunuldu.</p><a href="{{resetUrl}}" class="btn">Şifremi Sıfırla &rarr;</a>`)
  },
  {
    eventType: 'ORDER_CONFIRMED',
    name: 'Sipariş Onaylandı',
    subject: 'Siparişiniz Alındı — #{{orderNo}} 📦',
    variables: 'userName,orderNo,orderDate,orderTotal,shippingAddress,orderDetailUrl,recipientEmail',
    status: 'ACTIVE',
    bodyHtml: baseLayout(`<h2>Siparişiniz alındı! 🎉</h2><p>Merhaba <strong>{{userName}}</strong>,</p><p><strong>#{{orderNo}}</strong> numaralı siparişiniz özenle hazırlanıyor.</p><a href="{{orderDetailUrl}}" class="btn">Sipariş Detayı &rarr;</a>`)
  },
  {
    eventType: 'ORDER_SHIPPED',
    name: 'Sipariş Kargoya Verildi',
    subject: 'Siparişiniz Kargoya Verildi — #{{orderNo}} 🚚',
    variables: 'userName,orderNo,cargoCompany,trackingNo,trackingUrl,estimatedDelivery,recipientEmail',
    status: 'ACTIVE',
    bodyHtml: baseLayout(`<h2>Siparişiniz yola çıktı! 🚚</h2><p><strong>#{{orderNo}}</strong> numaralı siparişiniz kargoya teslim edilmiştir.</p><a href="{{trackingUrl}}" class="btn">Kargo Takibi &rarr;</a>`)
  },
  {
    eventType: 'B2B_APPROVED',
    name: 'B2B Bayi Hesabı Onaylandı',
    subject: 'Tebrikler! Bayi Hesabınız Aktif Edildi — Pekefe B2B 🏆',
    variables: 'userName,companyName,b2bGroup,discountRate,loginUrl,recipientEmail',
    status: 'ACTIVE',
    bodyHtml: baseLayout(`<h2>Tebrikler! Bayi hesabınız onaylandı 🏆</h2><p><strong>{{companyName}}</strong> firması için B2B bayi hesabınız aktif edildi.</p><a href="{{loginUrl}}" class="btn">Bayi Paneline Giriş &rarr;</a>`)
  }
];

// GET all email templates (Admin Only) with Auto-Seed Resilience
export const GET = async (req: NextRequest) => {
  try {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse && process.env.NODE_ENV === "production") return rateLimitResponse;

    let templates = await prisma.emailTemplate.findMany({
      orderBy: { eventType: 'asc' }
    });

    // Auto-Seed if empty or table just created
    if (!templates || templates.length === 0) {
      for (const tpl of FALLBACK_TEMPLATES) {
        try {
          await prisma.emailTemplate.create({
            data: tpl
          });
        } catch (e) {}
      }
      templates = await prisma.emailTemplate.findMany({
        orderBy: { eventType: 'asc' }
      });
    }

    return NextResponse.json(templates || []);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    const now = new Date().toISOString();
    const mockTemplates = FALLBACK_TEMPLATES.map((t, idx) => ({
      id: `fallback-${idx}`,
      ...t,
      createdAt: now,
      updatedAt: now
    }));
    return NextResponse.json(mockTemplates);
  }
};

// POST create a new email template (Admin Only)
export const POST = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { eventType, name, subject, bodyHtml, variables, status } = body;

      if (!eventType || !name || !subject || !bodyHtml) {
        return NextResponse.json({ error: 'Eksik parametre girdiniz.' }, { status: 400 });
      }

      const existing = await prisma.emailTemplate.findUnique({
        where: { eventType }
      });

      if (existing) {
        return NextResponse.json({ error: 'Bu olay tipi (Event Type) ile kayıtlı bir şablon zaten mevcut.' }, { status: 400 });
      }

      const template = await prisma.emailTemplate.create({
        data: {
          eventType,
          name,
          subject,
          bodyHtml,
          variables: variables || '',
          status: status || 'ACTIVE'
        }
      });

      return NextResponse.json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
