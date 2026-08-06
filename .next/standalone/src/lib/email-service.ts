import { prisma } from './prisma';
import { emailQueue } from './email-queue';

interface SendEmailParams {
  eventType: string;
  recipient: string;
  variables: Record<string, string>;
}

export const emailService = {
  /**
   * Sends an email using a database-driven or fallback template.
   */
  async sendEmail({ eventType, recipient, variables }: SendEmailParams): Promise<string> {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { eventType }
      });

      if (!template || template.status !== 'ACTIVE') {
        console.warn(`[EMAIL SERVICE] Active template not found for event: ${eventType}. Using fallback.`);
        const fallback = this.getFallbackTemplate(eventType, variables);
        return await emailQueue.addToQueue(recipient, fallback.subject, fallback.bodyHtml, eventType);
      }

      let subject = template.subject;
      let bodyHtml = template.bodyHtml;

      Object.entries(variables).forEach(([key, val]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        subject = subject.replace(regex, val);
        bodyHtml = bodyHtml.replace(regex, val);
      });

      subject = subject.replace(/{{\s*\w+\s*}}/g, '');
      bodyHtml = bodyHtml.replace(/{{\s*\w+\s*}}/g, '');

      return await emailQueue.addToQueue(recipient, subject, bodyHtml, eventType);
    } catch (error) {
      console.error(`[EMAIL SERVICE] Failed to send email for event ${eventType}:`, error);
      throw error;
    }
  },

  /**
   * Helper to trigger a mock test email for a given template using default variables.
   */
  async sendTestEmail(eventType: string, recipient: string): Promise<string> {
    const dummyVariables: Record<string, Record<string, string>> = {
      welcome: {
        kullanici_adi: "Test Kullanıcı",
        aktivasyon_linki: "http://localhost:3000/giris"
      },
      forgot_password: {
        kullanici_adi: "Test Kullanıcı",
        sifirlama_linki: "http://localhost:3000/giris?reset=token"
      },
      password_changed: {
        kullanici_adi: "Test Kullanıcı"
      },
      order_received: {
        kullanici_adi: "Test Kullanıcı",
        siparis_no: "SP-998877",
        siparis_tutari: "12,500.00 ₺",
        detay_linki: "http://localhost:3000/hesap"
      },
      order_completed: {
        kullanici_adi: "Test Kullanıcı",
        siparis_no: "SP-998877"
      },
      cargo_shipped: {
        kullanici_adi: "Test Kullanıcı",
        siparis_no: "SP-998877",
        kargo_firmasi: "Yurtiçi Kargo",
        takip_no: "YK1234567890",
        takip_linki: "https://yurticikargo.com/query?no=YK1234567890"
      },
      reconciliation_request: {
        cari_unvan: "Pekefe Geleneksel Gıda Ürünleri Ltd. Şti.",
        bakiye: "45,670.00 ₺ (Alacaklı)",
        vade_tarihi: "30.06.2026",
        onay_linki: "http://localhost:3000/b2b"
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
