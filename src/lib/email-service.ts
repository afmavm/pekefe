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
    const dummyVariables: Record<string, Record<string, string>> = {
      welcome: {
        kullanici_adi: "Test Kullanıcı",
        aktivasyon_linki: `${siteUrl}/giris`
      },
      forgot_password: {
        kullanici_adi: "Test Kullanıcı",
        sifirlama_linki: `${siteUrl}/giris?reset=token`,
        sifirlama_kodu: "482910"
      },
      password_changed: {
        kullanici_adi: "Test Kullanıcı",
        tarih: new Date().toLocaleString("tr-TR")
      },
      order_received: {
        kullanici_adi: "Test Kullanıcı",
        siparis_no: "PKF-2026-998877",
        siparis_tutari: "1.250,00",
        siparis_icerik: "• İspir Dut Pekmezi × 2 adet",
        odeme_yontemi: "Kredi Kartı",
        kargo_adresi: "İspir / Erzurum",
        kargo_sirketi: "Yurtiçi Kargo",
        tarih: new Date().toLocaleString("tr-TR"),
        detay_linki: `${siteUrl}/hesap`
      },
      order_cancelled: {
        kullanici_adi: "Test Kullanıcı",
        siparis_no: "PKF-2026-998877",
        iptal_nedeni: "Müşteri talebi doğrultusunda iptal edilmiştir.",
        siparis_ozeti: "İspir Dut Pekmezi (2)",
        siparis_tutari: "1.250,00",
        odeme_yontemi: "Kredi Kartı",
        tarih: new Date().toLocaleString("tr-TR"),
        detay_linki: `${siteUrl}/hesap`
      },
      order_status_updated: {
        kullanici_adi: "Test Kullanıcı",
        siparis_no: "PKF-2026-998877",
        siparis_durumu: "Hazırlanıyor",
        siparis_tutari: "1.250,00",
        kargo_sirketi: "Yurtiçi Kargo",
        takip_no: "YK1234567890",
        tarih: new Date().toLocaleDateString("tr-TR"),
        detay_linki: `${siteUrl}/hesap`
      },
      order_completed: {
        kullanici_adi: "Test Kullanıcı",
        siparis_no: "PKF-2026-998877"
      },
      cargo_shipped: {
        kullanici_adi: "Test Kullanıcı",
        siparis_no: "PKF-2026-998877",
        kargo_sirketi: "Yurtiçi Kargo",
        kargo_firmasi: "Yurtiçi Kargo",
        takip_no: "YK1234567890",
        tarih: new Date().toLocaleDateString("tr-TR"),
        detay_linki: `${siteUrl}/hesap`,
        takip_linki: "https://www.yurticikargo.com/"
      },
      reconciliation_request: {
        cari_unvan: "Pekefe Geleneksel Gıda Ürünleri Ltd. Şti.",
        bakiye: "45.670,00 ₺ (Alacaklı)",
        vade_tarihi: "30.06.2026",
        onay_linki: `${siteUrl}/b2b`
      }
    };

    const vars = dummyVariables[eventType] || { kullanici_adi: "Test Kullanıcı" };
    return await this.sendEmail({
      eventType,
      recipient,
      variables: vars
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
