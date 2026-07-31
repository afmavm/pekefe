import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Ortak HTML base layout — Pekefe Bordo Theme (#6b1d2f)
const base = (content: string) => `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Pekefe Geleneksel Lezzetler</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #333; }
  .wrapper { max-width: 620px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
  .header { background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 40px; text-align: center; }
  .header h1 { color: #fff; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
  .header p { color: #fef3c7; font-size: 12px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
  .body { padding: 36px 40px; }
  .body h2 { font-size: 20px; color: #1a0a10; margin-bottom: 16px; font-weight: 700; }
  .body p { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 14px; }
  .btn { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #fff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin: 12px 0 18px; box-shadow: 0 4px 14px rgba(107,29,47,0.25); }
  .info-box { background: #fffbf5; border-left: 4px solid #d97706; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
  .info-box p { color: #78350f; margin: 0; font-size: 13px; margin-bottom: 6px; }
  .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  .order-table th { background: #fcf8f6; padding: 10px 14px; text-align: left; font-weight: 600; color: #6b1d2f; border-bottom: 2px solid #e2e8f0; }
  .order-table td { padding: 10px 14px; border-bottom: 1px solid #eee; color: #444; }
  .order-table .total td { font-weight: 700; color: #6b1d2f; border-top: 2px solid #e2e8f0; background: #fffbf5; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  .footer { background: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 24px 40px; text-align: center; }
  .footer p { color: #94a3b8; font-size: 11px; line-height: 1.8; }
  .footer a { color: #6b1d2f; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🌿 PEKEFE</h1>
    <p>Geleneksel &amp; Doğal Lezzetler · İspir</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>&copy; 2026 Pekefe Geleneksel Lezzetler. Tüm Hakları Saklıdır.</p>
    <p>Bu e-posta {{recipientEmail}} adresine gönderilmiştir.</p>
    <p><a href="mailto:info@pekefe.com">info@pekefe.com</a> | <a href="http://localhost:3000">www.pekefe.com</a></p>
  </div>
</div>
</body>
</html>`;

const DEFAULT_TEMPLATES = [
  {
    eventType: 'WELCOME',
    name: 'Hoş Geldiniz - Yeni Üyelik',
    subject: "Pekefe Ailesine Hoş Geldiniz, {{userName}}! 🌿",
    variables: JSON.stringify(['userName', 'userEmail', 'loginUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Aramıza Hoş Geldiniz, {{userName}}! ✨</h2>
      <p>Pekefe ailesine katıldığınız için teşekkür ederiz. Hesabınız başarıyla oluşturulmuştur.</p>
      <p>Anadolu'nun bereketli yaylalarından süzülen %100 doğal ve geleneksel ürün koleksiyonumuz artık hizmetinizde!</p>
      <div class="info-box"><p>✅ Hesabınız <strong>{{userEmail}}</strong> adresiyle aktif edilmiştir.</p></div>
      <a href="{{loginUrl}}" class="btn">Alışverişe Başla &rarr;</a>`)
  },
  {
    eventType: 'PASSWORD_RESET',
    name: 'Şifre Sıfırlama İsteği',
    subject: 'Şifrenizi Sıfırlayın - Pekefe',
    variables: JSON.stringify(['userName', 'resetUrl', 'expiresIn', 'recipientEmail']),
    bodyHtml: base(`<h2>Şifre Sıfırlama Talebi</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p>Hesabınız için şifre sıfırlama talebinde bulunuldu. Şifrenizi yenilemek için aşağıdaki butona tıklayın.</p>
      <div class="info-box"><p>⌛ Bu bağlantı güvenlik nedeniyle <strong>{{expiresIn}}</strong> içinde geçerliliğini yitirecektir.</p></div>
      <a href="{{resetUrl}}" class="btn">Şifremi Sıfırla &rarr;</a>
      <hr class="divider" />
      <p style="font-size:12px;color:#888;">Bu talebi siz yapmadıysanız bu e-postayı güvenle göz ardı edebilirsiniz.</p>`)
  },
  {
    eventType: 'ORDER_CONFIRMED',
    name: 'Sipariş Onaylandı',
    subject: 'Siparişiniz Alındı — #{{orderNo}} 📦',
    variables: JSON.stringify(['userName', 'orderNo', 'orderDate', 'orderTotal', 'shippingAddress', 'orderDetailUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Siparişiniz alındı! 🎉</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p>Siparişiniz tarafımıza ulaşmış ve özenle hazırlanmaya başlanmıştır. Ürünleriniz kargoya teslim edildiğinde bilgilendirileceksiniz.</p>
      <div class="info-box">
        <p>📦 Sipariş No: <strong>#{{orderNo}}</strong></p>
        <p>📅 Sipariş Tarihi: <strong>{{orderDate}}</strong></p>
        <p>📍 Teslimat Adresi: <strong>{{shippingAddress}}</strong></p>
        <p>💰 Toplam Tutar: <strong>{{orderTotal}}</strong></p>
      </div>
      <a href="{{orderDetailUrl}}" class="btn">Sipariş Detayını Gör &rarr;</a>`)
  },
  {
    eventType: 'ORDER_SHIPPED',
    name: 'Sipariş Kargoya Verildi',
    subject: 'Siparişiniz Kargoya Verildi — #{{orderNo}} 🚚',
    variables: JSON.stringify(['userName', 'orderNo', 'cargoCompany', 'trackingNo', 'trackingUrl', 'estimatedDelivery', 'recipientEmail']),
    bodyHtml: base(`<h2>Siparişiniz yola çıktı! 🚚</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz <strong>{{cargoCompany}}</strong> aracılığıyla kargoya verilmiştir.</p>
      <div class="info-box">
        <p>🔍 Kargo Takip No: <strong>{{trackingNo}}</strong></p>
        <p>📅 Tahmini Teslim Tarihi: <strong>{{estimatedDelivery}}</strong></p>
      </div>
      <a href="{{trackingUrl}}" class="btn">Kargo Takibi Yap &rarr;</a>`)
  },
  {
    eventType: 'ORDER_DELIVERED',
    name: 'Sipariş Teslim Edildi',
    subject: 'Siparişiniz Teslim Edildi — #{{orderNo}} ✅',
    variables: JSON.stringify(['userName', 'orderNo', 'deliveredAt', 'feedbackUrl', 'shopUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Siparişiniz teslim edildi! ✅</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz <strong>{{deliveredAt}}</strong> tarihinde başarıyla teslim edilmiştir.</p>
      <p>Geleneksel lezzetlerimiz ve alışveriş deneyiminiz hakkındaki görüşleriniz bizim için çok değerlidir.</p>
      <a href="{{feedbackUrl}}" class="btn">Değerlendirme Yap &rarr;</a>`)
  },
  {
    eventType: 'PAYMENT_RECEIVED',
    name: 'Ödeme Alındı',
    subject: 'Ödemeniz Onaylandı — #{{orderNo}} 💳',
    variables: JSON.stringify(['userName', 'orderNo', 'paymentAmount', 'paymentMethod', 'paymentDate', 'invoiceUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Ödemeniz alındı! 💳</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz için ödemeniz başarıyla onaylanmıştır.</p>
      <div class="info-box">
        <p>💰 Ödeme Tutarı: <strong>{{paymentAmount}}</strong></p>
        <p>💳 Ödeme Yöntemi: <strong>{{paymentMethod}}</strong></p>
        <p>📅 Ödeme Tarihi: <strong>{{paymentDate}}</strong></p>
      </div>
      <a href="{{invoiceUrl}}" class="btn">Faturayı İndir &rarr;</a>`)
  },
  {
    eventType: 'ORDER_CANCELLED',
    name: 'Sipariş İptal Edildi',
    subject: 'Siparişiniz İptal Edildi — #{{orderNo}}',
    variables: JSON.stringify(['userName', 'orderNo', 'cancelReason', 'refundAmount', 'refundMethod', 'refundDays', 'shopUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Siparişiniz iptal edildi</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz aşağıdaki nedenle iptal edilmiştir:</p>
      <div class="info-box"><p>📝 İptal Nedeni: <strong>{{cancelReason}}</strong></p></div>
      <p>Ödeme yapıldıysa, <strong>{{refundAmount}}</strong> tutarındaki iade işlemi <strong>{{refundDays}}</strong> iş günü içerisinde <strong>{{refundMethod}}</strong> aracılığıyla gerçekleştirilecektir.</p>
      <a href="{{shopUrl}}" class="btn">Alışverişe Devam Et &rarr;</a>`)
  },
  {
    eventType: 'ORDER_RETURNED',
    name: 'İade Onaylandı',
    subject: 'İadeniz Onaylandı — #{{orderNo}} 🔄',
    variables: JSON.stringify(['userName', 'orderNo', 'refundAmount', 'refundDays', 'refundMethod', 'recipientEmail']),
    bodyHtml: base(`<h2>İadeniz onaylandı! 🔄</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz için yaptığınız iade talebi onaylanmıştır.</p>
      <div class="info-box">
        <p>💰 İade Edilecek Tutar: <strong>{{refundAmount}}</strong></p>
        <p>💳 İade Yöntemi: <strong>{{refundMethod}}</strong></p>
        <p>⌛ Tahmini İade Süresi: <strong>{{refundDays}} iş günü</strong></p>
      </div>`)
  },
  {
    eventType: 'B2B_APPROVED',
    name: 'B2B Bayi Hesabı Onaylandı',
    subject: 'Tebrikler! Bayi Hesabınız Aktif Edildi — Pekefe B2B 🏆',
    variables: JSON.stringify(['userName', 'companyName', 'b2bGroup', 'discountRate', 'loginUrl', 'catalogUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Tebrikler! Bayi hesabınız aktif edildi! 🏆</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>{{companyName}}</strong> firması adına yapmış olduğunuz Pekefe B2B bayi başvurusu onaylanmıştır!</p>
      <div class="info-box">
        <p>🏷️ Bayi Grubu: <strong>{{b2bGroup}}</strong></p>
        <p>💰 Özel İndirim Oranınız: <strong>%{{discountRate}}</strong></p>
      </div>
      <p>Artık Pekefe B2B bayi fiyatlarıyla giriş yapabilir ve siparişlerinizi özel iskonto oranlarıyla verebilirsiniz.</p>
      <a href="{{loginUrl}}" class="btn">Bayi Paneline Giriş Yap &rarr;</a>`)
  },
  {
    eventType: 'B2B_REJECTED',
    name: 'B2B Bayi Başvurusu Reddedildi',
    subject: 'B2B Başvurunuz Hakkında Bilgilendirme — Pekefe B2B',
    variables: JSON.stringify(['userName', 'companyName', 'rejectReason', 'contactUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Bayi Başvurunuz Hakkında</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>{{companyName}}</strong> firması adına yaptığınız Pekefe B2B bayi başvurusu incelenmiş olup, bu aşamada onaylanamamıştır.</p>
      <div class="info-box"><p>📝 Gerekçe: <strong>{{rejectReason}}</strong></p></div>
      <p>Bilgilerinizi güncelleyerek bizimle iletişime geçebilirsiniz.</p>
      <a href="{{contactUrl}}" class="btn">İletişime Geçin &rarr;</a>`)
  },
  {
    eventType: 'LOW_STOCK_ALERT',
    name: 'Kritik Stok Uyarısı (Admin)',
    subject: 'Kritik Stok Uyarısı — {{productName}}',
    variables: JSON.stringify(['productName', 'sku', 'currentStock', 'criticalLimit', 'warehouseName', 'adminPanelUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>⚠️ Kritik Stok Seviyesi Uyarısı</h2>
      <p>Aşağıdaki ürünün stok seviyesi kritik limitin altına düşmüştür.</p>
      <table class="order-table">
        <tbody>
          <tr><td>Ürün Adı</td><td><strong>{{productName}}</strong></td></tr>
          <tr><td>SKU</td><td><strong>{{sku}}</strong></td></tr>
          <tr><td>Mevcut Stok</td><td><span class="badge badge-warning">{{currentStock}} Adet</span></td></tr>
          <tr><td>Kritik Limit</td><td><strong>{{criticalLimit}} Adet</strong></td></tr>
          <tr><td>Bulunduğu Depo</td><td><strong>{{warehouseName}}</strong></td></tr>
        </tbody>
      </table>
      <a href="{{adminPanelUrl}}" class="btn">Yönetim Paneline Git &rarr;</a>`)
  },
  {
    eventType: 'EMAIL_VERIFICATION',
    name: 'E-posta Doğrulama',
    subject: 'E-posta Adresinizi Doğrulayın — Pekefe ✉️',
    variables: JSON.stringify(['userName', 'verifyUrl', 'expiresIn', 'recipientEmail']),
    bodyHtml: base(`<h2>E-posta adresinizi doğrulayın ✉️</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p>Üyelik kaydınızı tamamlamak ve hesabınızı aktif etmek için lütfen e-posta adresinizi doğrulayın.</p>
      <div class="info-box"><p>⌛ Bu bağlantı <strong>{{expiresIn}}</strong> içinde geçerliliğini yitirecektir.</p></div>
      <a href="{{verifyUrl}}" class="btn">E-postamı Doğrula &rarr;</a>
      <hr class="divider" />
      <p style="font-size:12px;color:#888;">Bu kaydı siz oluşturmadıysanız bu e-postayı güvenle göz ardı edebilirsiniz.</p>`)
  },
];

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const results: Array<{ eventType: string; action: string; error?: string }> = [];

    for (const tpl of DEFAULT_TEMPLATES) {
      try {
        const existing = await prisma.emailTemplate.findUnique({
          where: { eventType: tpl.eventType }
        });

        if (existing) {
          await prisma.emailTemplate.update({
            where: { eventType: tpl.eventType },
            data: {
              name: tpl.name,
              subject: tpl.subject,
              bodyHtml: tpl.bodyHtml,
              variables: tpl.variables,
            }
          });
          results.push({ eventType: tpl.eventType, action: 'updated' });
        } else {
          await prisma.emailTemplate.create({
            data: {
              eventType: tpl.eventType,
              name: tpl.name,
              subject: tpl.subject,
              bodyHtml: tpl.bodyHtml,
              variables: tpl.variables,
              status: 'ACTIVE',
            }
          });
          results.push({ eventType: tpl.eventType, action: 'created' });
        }
      } catch (err: any) {
        results.push({ eventType: tpl.eventType, action: 'error', error: err.message });
      }
    }

    const created = results.filter(r => r.action === 'created').length;
    const updated = results.filter(r => r.action === 'updated').length;
    const errors = results.filter(r => r.action === 'error').length;

    return NextResponse.json({
      success: true,
      summary: { created, updated, errors, total: DEFAULT_TEMPLATES.length },
      results
    });
  } catch (error: any) {
    console.error('Seed email templates error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
