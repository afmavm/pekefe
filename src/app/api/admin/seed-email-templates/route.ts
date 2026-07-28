import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Ortak HTML base layout
const base = (content: string) => `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Atak Aricilik</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; color: #333; }
  .wrapper { max-width: 620px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #b45309 0%, #92400e 100%); padding: 32px 40px; text-align: center; }
  .header h1 { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
  .header p { color: rgba(255,255,255,0.82); font-size: 13px; margin-top: 4px; }
  .body { padding: 36px 40px; }
  .body h2 { font-size: 20px; color: #1a1a1a; margin-bottom: 16px; }
  .body p { font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 14px; }
  .btn { display: inline-block; padding: 14px 32px; background: #b45309; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 10px 0 18px; }
  .info-box { background: #fef3c7; border-left: 4px solid #b45309; border-radius: 6px; padding: 14px 18px; margin: 20px 0; }
  .info-box p { color: #92400e; margin: 0; font-size: 13px; margin-bottom: 6px; }
  .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  .order-table th { background: #f8f8f8; padding: 10px 14px; text-align: left; font-weight: 600; color: #333; border-bottom: 2px solid #e5e5e5; }
  .order-table td { padding: 10px 14px; border-bottom: 1px solid #eee; color: #444; }
  .order-table .total td { font-weight: 700; color: #b45309; border-top: 2px solid #e5e5e5; background: #fffbf0; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  .footer { background: #1a1a1a; padding: 24px 40px; text-align: center; }
  .footer p { color: #888; font-size: 11px; line-height: 1.8; }
  .footer a { color: #b45309; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>&#x1F41D; ATAK ARICILIK</h1>
    <p>Turkiye'nin Lider Aricilik Ekipmanlari Tedarikcisi</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>&copy; 2026 Atak Aricilik. Tum Haklari Saklidir.</p>
    <p>Bu e-posta {{recipientEmail}} adresine gonderilmistir.</p>
    <p><a href="mailto:info@atakaricilik.com">info@atakaricilik.com</a> | <a href="tel:+905441494851">0544 149 48 51</a></p>
  </div>
</div>
</body>
</html>`;

const DEFAULT_TEMPLATES = [
  {
    eventType: 'WELCOME',
    name: 'Hoş Geldiniz - Yeni Üyelik',
    subject: "Atak Arıcılık'a Hoş Geldiniz, {{userName}}!",
    variables: JSON.stringify(['userName', 'userEmail', 'loginUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Merhaba, {{userName}}!</h2>
      <p>Atak Arıcılık ailesine katıldığınız için çok mutluyuz. Hesabınız başarıyla oluşturulmuştur.</p>
      <p>Türkiye'nin en geniş ve en kaliteli profesyonel arıcılık ekipmanları kataloğu artık hizmetinizde!</p>
      <div class="info-box"><p>✅ Hesabınız <strong>{{userEmail}}</strong> adresiyle aktif edilmiştir.</p></div>
      <a href="{{loginUrl}}" class="btn">Alışverişe Başla &rarr;</a>`)
  },
  {
    eventType: 'PASSWORD_RESET',
    name: 'Şifre Sıfırlama İsteği',
    subject: 'Şifrenizi Sıfırlayın - Atak Arıcılık',
    variables: JSON.stringify(['userName', 'resetUrl', 'expiresIn', 'recipientEmail']),
    bodyHtml: base(`<h2>Şifre Sıfırlama Talebi</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p>Hesabınız için şifre sıfırlama talebinde bulunuldu. Şifrenizi sıfırlamak için aşağıdaki butona tıklayınız.</p>
      <div class="info-box"><p>⌛ Bu bağlantı güvenlik nedeniyle <strong>{{expiresIn}}</strong> içinde geçerliliğini yitirecektir.</p></div>
      <a href="{{resetUrl}}" class="btn">Şifremi Sıfırla &rarr;</a>
      <hr class="divider" />
      <p style="font-size:12px;color:#888;">Bu talebi siz yapmadıysanız bu e-postayı güvenle göz ardı edebilirsiniz.</p>`)
  },
  {
    eventType: 'ORDER_CONFIRMED',
    name: 'Sipariş Onaylandı',
    subject: 'Siparişiniz Alındı - #{{orderNo}}',
    variables: JSON.stringify(['userName', 'orderNo', 'orderDate', 'orderTotal', 'shippingAddress', 'orderDetailUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Siparişiniz alındı! 🎉</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p>Siparişiniz tarafımıza ulaşmış ve hazırlık süreci başlatılmıştır. Siparişiniz kargoya teslim edildiğinde bilgilendirileceksiniz.</p>
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
    subject: 'Siparişiniz Kargoya Verildi - #{{orderNo}}',
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
    subject: 'Siparişiniz Teslim Edildi - #{{orderNo}}',
    variables: JSON.stringify(['userName', 'orderNo', 'deliveredAt', 'feedbackUrl', 'shopUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Siparişiniz teslim edildi! ✅</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz <strong>{{deliveredAt}}</strong> tarihinde başarıyla teslim edilmiştir.</p>
      <p>Ürünlerimiz ve alışveriş deneyiminiz hakkındaki görüşleriniz bizim için çok değerlidir. Deneyiminizi bizimle paylaşmak ister misiniz?</p>
      <a href="{{feedbackUrl}}" class="btn">Değerlendirme Yap &rarr;</a>`)
  },
  {
    eventType: 'PAYMENT_RECEIVED',
    name: 'Ödeme Alındı',
    subject: 'Ödemeniz Onaylandı - #{{orderNo}}',
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
    subject: 'Siparişiniz İptal Edildi - #{{orderNo}}',
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
    subject: 'İadeniz Onaylandı - #{{orderNo}}',
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
    subject: 'Bayi Hesabınız Aktif Edildi! - Atak Arıcılık',
    variables: JSON.stringify(['userName', 'companyName', 'b2bGroup', 'discountRate', 'loginUrl', 'catalogUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Tebrikler! Bayi hesabınız aktif edildi! 🏆</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>{{companyName}}</strong> firması adına yapmış olduğunuz B2B bayi başvurusu onaylanmıştır!</p>
      <div class="info-box">
        <p>🏷️ Bayi Grubu: <strong>{{b2bGroup}}</strong></p>
        <p>💰 Özel İndirim Oranınız: <strong>%{{discountRate}}</strong></p>
      </div>
      <p>Artık B2B bayi fiyatlarıyla giriş yapabilir ve siparişlerinizi özel iskonto oranlarıyla verebilirsiniz.</p>
      <a href="{{loginUrl}}" class="btn">Bayi Paneline Giriş Yap &rarr;</a>`)
  },
  {
    eventType: 'B2B_REJECTED',
    name: 'B2B Bayi Başvurusu Reddedildi',
    subject: 'B2B Başvurunuz Hakkında Bilgilendirme - Atak Arıcılık',
    variables: JSON.stringify(['userName', 'companyName', 'rejectReason', 'contactUrl', 'recipientEmail']),
    bodyHtml: base(`<h2>Bayi Başvurunuz Hakkında</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>{{companyName}}</strong> firması adına yaptığınız B2B bayi başvurusu incelenmiş olup, bu aşamada onaylanamamıştır.</p>
      <div class="info-box"><p>📝 Gerekçe: <strong>{{rejectReason}}</strong></p></div>
      <p>Eksik belgelerinizi veya bilgilerinizi güncelleyerek bizimle iletişime geçebilir ya da tekrar başvurabilirsiniz.</p>
      <a href="{{contactUrl}}" class="btn">İletişime Geçin &rarr;</a>`)
  },
  {
    eventType: 'LOW_STOCK_ALERT',
    name: 'Kritik Stok Uyarısı (Admin)',
    subject: 'Kritik Stok Uyarısı - {{productName}}',
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
    subject: 'E-posta Adresinizi Doğrulayın - Atak Arıcılık',
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
