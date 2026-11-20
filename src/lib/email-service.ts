import { emailNotificationService } from './email-notification-service';

interface SendEmailParams {
  eventType: string;
  recipient: string;
  variables: Record<string, string>;
}

export const emailService = {
  /**
   * Sends an email using the unified EmailNotificationService (live .env SMTP + DB/in-memory templates).
   */
  async sendEmail({ eventType, recipient, variables }: SendEmailParams): Promise<string> {
    return await emailNotificationService.queueEmail(recipient, eventType, variables);
  },

  /**
   * Helper to trigger a test email for a given template using default variables.
   */
  async sendTestEmail(eventType: string, recipient: string): Promise<string> {
    const siteUrl = emailNotificationService.getSiteUrl();
    const todayStr = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const nowStr = new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

    // Hem Türkçe hem İngilizce değişkenleri eksiksiz doldur (tüm DB ve varsayılan şablonlarla %100 uyumlu)
    const baseTestVars: Record<string, string> = {
      kullanici_adi: "Ahmet Yılmaz",
      userName: "Ahmet Yılmaz",
      name: "Ahmet Yılmaz",
      userEmail: recipient,
      recipientEmail: recipient,
      email: recipient,
      cari_unvan: "Pekefe Geleneksel Gıda Ltd. Şti.",
      cariUnvan: "Pekefe Geleneksel Gıda Ltd. Şti.",
      companyName: "Pekefe Geleneksel Gıda Ltd. Şti.",
      cari_kod: "PKF-CARI-1001",
      cariKod: "PKF-CARI-1001",
      siparis_no: "PKF-2026-998877",
      orderNo: "PKF-2026-998877",
      siparis_tutari: "1.250,00 ₺",
      orderTotal: "1.250,00 ₺",
      paymentAmount: "1.250,00 ₺",
      refundAmount: "1.250,00 ₺",
      siparis_icerik: "• İspir Dut Gün Pekmezi 700g × 2 adet",
      siparis_ozeti: "İspir Dut Gün Pekmezi 700g (2)",
      siparis_durumu: "Hazırlanıyor",
      odeme_yontemi: "Kredi Kartı (PayTR 3D Secure)",
      paymentMethod: "Kredi Kartı (PayTR 3D Secure)",
      refundMethod: "Kredi Kartına İade",
      kargo_sirketi: "Yurtiçi Kargo",
      kargo_firmasi: "Yurtiçi Kargo",
      cargoCompany: "Yurtiçi Kargo",
      kargo_adresi: "Çamlıca Mah. No:12 İspir / Erzurum",
      shippingAddress: "Çamlıca Mah. No:12 İspir / Erzurum",
      takip_no: "YK1234567890TR",
      trackingNo: "YK1234567890TR",
      takip_linki: `${siteUrl}/hesap`,
      trackingUrl: `${siteUrl}/hesap`,
      detay_linki: `${siteUrl}/hesap`,
      orderDetailUrl: `${siteUrl}/hesap`,
      loginUrl: `${siteUrl}/giris`,
      aktivasyon_linki: `${siteUrl}/giris`,
      verifyUrl: `${siteUrl}/giris?verify=test`,
      resetUrl: `${siteUrl}/giris?reset=test`,
      sifirlama_linki: `${siteUrl}/giris?reset=test`,
      sifirlama_kodu: "482910",
      portalUrl: `${siteUrl}/b2b`,
      onay_linki: `${siteUrl}/b2b`,
      shopUrl: `${siteUrl}/kategoriler`,
      catalogUrl: `${siteUrl}/kategoriler`,
      contactUrl: `${siteUrl}/iletisim`,
      feedbackUrl: `${siteUrl}/hesap`,
      invoiceUrl: `${siteUrl}/hesap`,
      adminPanelUrl: `${siteUrl}/admin`,
      tarih: todayStr,
      orderDate: nowStr,
      paymentDate: nowStr,
      deliveredAt: nowStr,
      expiresIn: "24 saat",
      estimatedDelivery: "1–3 iş günü",
      refundDays: "1–7 iş günü",
      iptal_nedeni: "Müşteri talebi doğrultusunda iptal edilmiştir.",
      cancelReason: "Müşteri talebi doğrultusunda iptal edilmiştir.",
      rejectReason: "Eksik evrak nedeniyle başvurunuz şu an onaylanamamıştır.",
      bakiye: "45.670,00 ₺ (Alacaklı)",
      vade_tarihi: todayStr,
      b2bGroup: "Gold Bayi",
      discountRate: "20",
      productName: "İspir Dut Gün Pekmezi (700g)",
      sku: "PKF-PEKMEZ-700",
      currentStock: "4",
      criticalLimit: "10",
      warehouseName: "Erzurum İspir Ana Depo",
    };

    return await this.sendEmail({
      eventType,
      recipient,
      variables: baseTestVars
    });
  },

  /**
   * Fallback email templates if database isn't seeded or query fails.
   */
  getFallbackTemplate(eventType: string, variables: Record<string, string>) {
    const fallbackTemplates: Record<string, { subject: string; bodyHtml: string }> = {
      welcome: {
        subject: "Pekefe Ailesine Hoş Geldiniz",
        bodyHtml: `<h3>Hoş Geldiniz!</h3><p>Merhaba ${variables.kullanici_adi || 'Değerli Üye'}, Pekefe hesabınız aktifleştirilmiştir.</p>`
      },
      forgot_password: {
        subject: "Şifre Sıfırlama Talebi",
        bodyHtml: `<h3>Şifre Sıfırlama</h3><p>Şifrenizi sıfırlamak için lütfen linke tıklayın: ${variables.sifirlama_linki || '#'}</p>`
      },
      password_changed: {
        subject: "Şifreniz Değiştirildi",
        bodyHtml: `<h3>Şifreniz Değiştirildi</h3><p>Merhaba ${variables.kullanici_adi || ''}, şifreniz güncellenmiştir.</p>`
      },
      order_received: {
        subject: `Siparişiniz Alındı — ${variables.siparis_no || ''}`,
        bodyHtml: `<h3>Sipariş Alındı</h3><p>Sipariş No: ${variables.siparis_no || ''}</p><p>Tutar: ${variables.siparis_tutari || ''}</p>`
      },
      order_completed: {
        subject: `Siparişiniz Hazır — ${variables.siparis_no || ''}`,
        bodyHtml: `<h3>Siparişiniz Tamamlandı</h3><p>Sipariş No: ${variables.siparis_no || ''}</p>`
      },
      cargo_shipped: {
        subject: `Siparişiniz Kargoya Verildi — ${variables.siparis_no || ''}`,
        bodyHtml: `<h3>Kargoya Verildi</h3><p>Kargo: ${variables.kargo_firmasi || ''}</p><p>Takip No: ${variables.takip_no || ''}</p>`
      },
      reconciliation_request: {
        subject: `Cari Mutabakat Onay Talebi`,
        bodyHtml: `<h3>Cari Mutabakat</h3><p>Cari: ${variables.cari_unvan || ''}</p><p>Bakiye: ${variables.bakiye || ''}</p>`
      }
    };

    const temp = fallbackTemplates[eventType] || {
      subject: "Pekefe Bildirimi",
      bodyHtml: `<h3>Pekefe Bildirimi</h3><p>İşlem gerçekleştirildi.</p>`
    };

    let subject = temp.subject;
    let bodyHtml = temp.bodyHtml;

    Object.entries(variables).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, val);
      bodyHtml = bodyHtml.replace(regex, val);
    });

    return { subject, bodyHtml };
  }
};
