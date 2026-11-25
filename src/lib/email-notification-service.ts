import { prisma, withTimeout } from "./prisma";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { getLiveEnv } from "./env-helper";
import { wrapPekefeEmail } from "./email-brand-layout";

// Email Queue Item Interface
interface QueueItem {
  id: string;
  recipient: string;
  eventType: string;
  subject: string;
  bodyHtml: string;
  retryCount: number;
}

export class EmailNotificationService {
  private isProcessing = false;

  constructor() {}

  /**
   * Dynamically build a fresh, reliable SMTP transporter from live .env / process.env
   */
  private getTransporter(): { transporter: nodemailer.Transporter; fromEmail: string; fromName: string } {
    const host = getLiveEnv("SMTP_HOST", "smtp.turkticaret.net").trim();
    const portStr = getLiveEnv("SMTP_PORT", "465").trim();
    const port = Number(portStr) || 465;
    const user = getLiveEnv("SMTP_USER", "").trim();
    const pass = getLiveEnv("SMTP_PASS", "");
    const secureStr = getLiveEnv("SMTP_SECURE", "").trim().toLowerCase();
    // Port 465 daima implicit SSL/TLS (secure: true), Port 587 daima STARTTLS (secure: false)
    const secure = port === 465 ? true : port === 587 ? false : secureStr === "true";
    const fromEmail = user || "info@pekefe.com";
    const fromName = getLiveEnv("SMTP_FROM_NAME", "PEKEFE İSPİR YÖRESEL").trim() || "PEKEFE İSPİR YÖRESEL";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    });

    return { transporter, fromEmail, fromName };
  }

  public getSiteUrl(): string {
    const raw = getLiveEnv("NEXTAUTH_URL_INTERNAL", "") || getLiveEnv("NEXTAUTH_URL", "") || "https://www.pekefe.com";
    return raw.includes("localhost") && process.env.NODE_ENV === "production"
      ? "https://www.pekefe.com"
      : raw.replace(/\/$/, "");
  }

  public getAdminEmail(): string {
    const adminEmail = getLiveEnv("ADMIN_NOTIFICATION_EMAIL", "").trim();
    if (adminEmail && adminEmail.includes("@")) return adminEmail;
    const smtpUser = getLiveEnv("SMTP_USER", "").trim();
    if (smtpUser && smtpUser.includes("@")) return smtpUser;
    return "info@pekefe.com";
  }

  /**
   * Dynamically seeds a default Pekefe template if not found in database.
   */
  private async seedDefaultTemplate(eventType: string): Promise<any> {
    const defaultTemplates: Record<string, { name: string; subject: string; bodyHtml: string; variables: string }> = {
      welcome: {
        name: "Hoş Geldiniz (B2C)",
        subject: "Pekefe Ailesine Hoş Geldiniz! 🌿",
        variables: "kullanici_adi",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Geleneksel & Doğal Lezzetler</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700;">Aramıza Hoş Geldiniz! ✨</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe ailesine katıldığınız için teşekkür ederiz. Anadolu'nun bereketli yaylalarından süzülen %100 doğal lezzetlerimizi inceleyebilir ve siparişinizi oluşturabilirsiniz.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://www.pekefe.com/kategoriler" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Ürünleri Keşfet</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Sorularınız için bu e-postaya yanıt verebilir veya info@pekefe.com adresimizden bize ulaşabilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. Tüm hakları saklıdır.</p>
            </div>
          </div>
        `
      },
      dealer_applied: {
        name: "Bayilik Başvurusu Alındı (B2B)",
        subject: "Bayilik Başvurunuz Alındı - Pekefe B2B",
        variables: "kullanici_adi",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE B2B</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Kurumsal Bayi Portalı</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700;">Bayilik Başvurunuz Başarıyla Alındı</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe B2B Kurumsal Bayi Portalı için yapmış olduğunuz başvuru sistemimize ulaşmıştır. Başvurunuz ekibimiz tarafından incelenmektedir.</p>
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">📌 Başvuru Durumu: İncelemede</p>
                <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.6;">Başvurunuz onaylandığında özel bayi iskonto oranlarınız tanımlanacak ve tarafınıza bilgilendirme yapılacaktır.</p>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Gösterdiğiniz ilgi için teşekkür ederiz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe B2B Kurumsal İş Ortaklığı.</p>
            </div>
          </div>
        `
      },
      dealer_approved: {
        name: "Bayilik Başvurusu Onaylandı (B2B)",
        subject: "Tebrikler! Bayilik Başvurunuz Onaylandı — Pekefe B2B 🏆",
        variables: "kullanici_adi,bayi_grubu,fiyat_grubu,kredi_limiti",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE B2B</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Bayilik Onayı</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #15803d; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Tebrikler, Bayiliğiniz Aktif Edildi! 🎉</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe B2B portalı bayilik başvurunuz onaylanmış ve yetkileriniz aktif edilmiştir. Hesabınıza tanımlanan detaylar aşağıdadır:</p>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 45%;">Bayi Grubu:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #6b1d2f;">{{bayi_grubu}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Fiyat Grubu:</td>
                    <td style="padding: 6px 0;">{{fiyat_grubu}} Fiyatı</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Kredi Limiti:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #15803d;">₺{{kredi_limiti}}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="http://localhost:3000/b2b" style="background: linear-gradient(135deg, #15803d, #16a34a); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(21, 128, 61, 0.25);">Bayi Portalına Giriş Yap</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Verimli ve bereketli iş ortaklıkları dileriz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">Pekefe B2B Yönetim Ekibi.</p>
            </div>
          </div>
        `
      },
      dealer_rejected: {
        name: "Bayilik Başvurusu Reddedildi (B2B)",
        subject: "Bayilik Başvurusu Hakkında - Pekefe B2B",
        variables: "kullanici_adi",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE B2B</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Bilgilendirme</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #b91c1c; margin-top: 0; font-size: 18px; font-weight: 700;">Bayilik Başvurunuz Hakkında</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe B2B portalı bayilik başvurunuz incelenmiş olup, mevcut kriterler doğrultusunda başvurunuz şu aşamada onaylanamamıştır.</p>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Detaylı bilgi almak için info@pekefe.com adresi üzerinden bizimle iletişime geçebilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">Pekefe B2B Yönetim Ekibi.</p>
            </div>
          </div>
        `
      },
      order_received: {
        name: "Sipariş Alındı (Sipariş Onayı)",
        subject: "Siparişiniz Alındı — Sipariş No: {{siparis_no}} 📦",
        variables: "kullanici_adi,siparis_no,siparis_tutari,siparis_icerik,odeme_yontemi,kargo_adresi,kargo_sirketi,tarih,detay_linki",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Geleneksel & Doğal Lezzetler — Sipariş Onayı</p>
            </div>
            <!-- Body -->
            <div style="padding: 36px 32px;">
              <div style="text-align: center; margin-bottom: 28px;">
                <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">✅</div>
                <h3 style="color: #1a0a10; margin: 16px 0 4px 0; font-size: 22px; font-weight: 800;">Siparişiniz Alındı!</h3>
                <p style="color: #64748b; font-size: 13px; margin: 0;">{{tarih}}</p>
              </div>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Siparişiniz başarıyla sistemimize ulaşmış ve hazırlık sürecine alınmıştır. Aşağıda sipariş detaylarınızı bulabilirsiniz.</p>

              <!-- Sipariş Özeti -->
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 14px; padding: 22px; margin: 24px 0;">
                <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #92400e;">📋 Sipariş Özeti</p>
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 7px 0; font-weight: 600; color: #64748b; width: 42%;">Sipariş Numarası</td>
                    <td style="padding: 7px 0; font-family: monospace; font-weight: 800; color: #6b1d2f;">{{siparis_no}}</td>
                  </tr>
                  <tr style="border-top: 1px solid #fde68a;">
                    <td style="padding: 7px 0; font-weight: 600; color: #64748b;">Sipariş Tutarı</td>
                    <td style="padding: 7px 0; font-weight: 800; color: #15803d; font-size: 16px;">₺{{siparis_tutari}}</td>
                  </tr>
                  <tr style="border-top: 1px solid #fde68a;">
                    <td style="padding: 7px 0; font-weight: 600; color: #64748b;">Ödeme Yöntemi</td>
                    <td style="padding: 7px 0; font-weight: 600; color: #1e293b;">{{odeme_yontemi}}</td>
                  </tr>
                </table>
              </div>

              <!-- Ürün Listesi -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin: 20px 0;">
                <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #334155;">🛒 Sipariş Edilen Ürünler</p>
                <div style="font-size: 14px; color: #475569; line-height: 2; white-space: pre-line;">{{siparis_icerik}}</div>
              </div>

              <!-- Kargo Adresi -->
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 14px; padding: 22px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #0369a1;">📦 Kargo Bilgileri</p>
                <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.7;"><strong>Teslimat Adresi:</strong><br>{{kargo_adresi}}</p>
              </div>

              <!-- CTA Butonu -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{detay_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.3);">Sipariş Durumumu Takip Et</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">Sorularınız için <a href="mailto:info@pekefe.com" style="color: #6b1d2f;">info@pekefe.com</a> adresinden bize ulaşabilirsiniz.</p>
            </div>
            <!-- Footer -->
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. Tüm hakları saklıdır.</p>
            </div>
          </div>
        `
      },
      order_status_updated: {
        name: "Sipariş Durum Güncellemesi",
        subject: "Siparişinizin Durumu Güncellendi: {{siparis_durumu}} — Sipariş No: {{siparis_no}} 📦",
        variables: "kullanici_adi,siparis_no,siparis_durumu,siparis_tutari,kargo_sirketi,takip_no,detay_linki,tarih",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Sipariş Durum Güncellemesi</p>
            </div>
            <!-- Body -->
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Siparişinizin Durumu Güncellendi</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;"><strong>{{siparis_no}}</strong> numaralı siparişinizin yeni durumu: <strong style="color: #6b1d2f; font-size: 16px;">{{siparis_durumu}}</strong></p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #334155;">🚚 Güncel Sipariş & Kargo Bilgileri</p>
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 45%;">Sipariş Numarası:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-weight: 800; color: #6b1d2f;">{{siparis_no}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Yeni Durum:</td>
                    <td style="padding: 6px 0; font-weight: 800; color: #15803d;">{{siparis_durumu}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Kargo Şirketi:</td>
                    <td style="padding: 6px 0; font-weight: 600;">{{kargo_sirketi}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Kargo Takip No:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #0369a1;">{{takip_no}}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Butonu -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{detay_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.3);">Sipariş Detayını Görüntüle</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz. Sorularınız için <a href="mailto:info@pekefe.com" style="color: #6b1d2f;">info@pekefe.com</a> adresinden bize ulaşabilirsiniz.</p>
            </div>
            <!-- Footer -->
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. Tüm hakları saklıdır.</p>
            </div>
          </div>
        `
      },
      order_cancelled: {
        name: "Sipariş İptal Bilgilendirmesi",
        subject: "Siparişiniz İptal Edildi — Sipariş No: #{{siparis_no}}",
        variables: "kullanici_adi,siparis_no,iptal_nedeni,siparis_ozeti,siparis_tutari,odeme_yontemi,tarih,detay_linki",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fecdd3; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Sipariş İptal Bilgilendirmesi</p>
            </div>
            <!-- Body -->
            <div style="padding: 36px 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;">Sipariş İptal Edildi</span>
              </div>
              <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin-top: 0;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;"><strong>#{{siparis_no}}</strong> numaralı siparişinizin iptal işlemi gerçekleştirilmiştir. İptal detayları ve gerekçesi aşağıda bilgilerinize sunulmuştur:</p>

              <!-- Cancellation Reason Box -->
              <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
                <p style="margin: 0 0 6px 0; color: #9f1239; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">İptal Nedeni</p>
                <p style="margin: 0; color: #881337; font-size: 14px; font-weight: 600; line-height: 1.6;">{{iptal_nedeni}}</p>
              </div>

              <!-- Order Summary Table -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin: 22px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Sipariş Numarası</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">#{{siparis_no}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">İptal Tarihi</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">{{tarih}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Sipariş İçeriği</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">{{siparis_ozeti}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Ödeme Yöntemi</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">{{odeme_yontemi}}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0 4px 0; color: #0f172a; font-weight: 700;">Toplam Tutar</td>
                    <td style="padding: 10px 0 4px 0; color: #6b1d2f; font-weight: 800; font-size: 15px; text-align: right;">₺{{siparis_tutari}}</td>
                  </tr>
                </table>
              </div>

              <!-- Refund Info -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
                <p style="margin: 0; color: #166534; font-size: 12.5px; line-height: 1.6;">
                  <strong>Ödeme &amp; İade Bilgilendirmesi:</strong> Kredi kartı veya banka havalesi ile ödeme gerçekleştirdiyseniz, iade tutarınız ödeme yönteminize bağlı olarak <strong>1–7 iş günü</strong> içerisinde hesabınıza/kartınıza yansıtılacaktır. Ödeme yapılmadıysa tarafınızdan herhangi bir tahsilat yapılmayacaktır.
                </p>
              </div>

              <div style="text-align: center; margin: 28px 0 20px 0;">
                <a href="{{detay_linki}}" style="display: inline-block; background-color: #6b1d2f; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 999px;">Siparişlerimi Görüntüle</a>
              </div>

              <p style="color: #64748b; font-size: 12.5px; line-height: 1.6; text-align: center; margin-bottom: 0;">
                Herhangi bir sorunuz veya yeni sipariş desteğiniz için <a href="mailto:info@pekefe.com" style="color: #6b1d2f; font-weight: 700;">info@pekefe.com</a> adresinden veya <strong>+90 534 270 91 40</strong> numaralı WhatsApp hattımızdan bize ulaşabilirsiniz.
              </p>
            </div>
            <!-- Footer -->
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. Tüm hakları saklıdır.</p>
            </div>
          </div>
        `
      },
      newsletter_welcome: {
        name: "Bülten Aboneliği Hoş Geldiniz",
        subject: "Pekefe Bülten Kulübüne Hoş Geldiniz! 🌿",
        variables: "email,brandName,siteUrl",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE BÜLTEN KULÜBÜ</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Geleneksel & Doğal Lezzetler</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Aramıza Hoş Geldiniz! ✨</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Merhaba,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe Bülten Kulübü'ne katıldığınız için teşekkür ederiz. İspir yaylalarının en özel sınırlı rekolte ürünleri, mevsimsel özel tadımlar ve size özel ayrıcalıklı fırsatlardan ilk siz haberdar olacaksınız.</p>
              
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 14px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">🎁 Kulüp Üyelerine Özel Ayrıcalıklar</p>
                <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.6;">Butik rekolte ürünlerinde öncelikli erişim ve bülten üyelerine özel sürpriz indirimler e-posta kutunuza gelecek.</p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="{{siteUrl}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Ürünleri Keşfet</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">Sorularınız veya istekleriniz için bu e-postaya yanıt verebilir veya info@pekefe.com adresimizden bize ulaşabilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. Tüm hakları saklıdır.</p>
            </div>
          </div>
        `
      },
      forgot_password: {
        name: "Şifre Sıfırlama Talebi",
        subject: "Şifre Sıfırlama Talebi - Pekefe",
        variables: "kullanici_adi,sifirlama_linki",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Hesap Güvenliği</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 18px; font-weight: 700;">Şifre Sıfırlama Talebi</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre oluşturmak için aşağıdaki butona tıklayın:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{sifirlama_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Yeni Şifre Oluştur</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Bu talebi siz yapmadıysanız bu e-postayı güvenle göz ardı edebilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler.</p>
            </div>
          </div>
        `
      },
      mutabakat: {
        name: "Cari Hesap Mutabakat Mektubu",
        subject: "Cari Hesap Mutabakat Talebi — {{tarih}} | PEKEFE",
        variables: "kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres,portalUrl,portalLabel",
        bodyHtml: wrapPekefeEmail({
          subtitle: "CARİ HESAP MUTABAKAT MEKTUBU",
          badge: "Cari Hesap Bakiye Bilgilendirmesi",
          title: "Mutabakat Mektubu",
          bodyHtml: `
            <p style="margin:0 0 12px 0;font-size:15px;color:#1e293b;">Sayın <strong>{{yetkili}}</strong>,</p>
            <p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.7;">Firmamız kayıtlarına göre <strong>{{tarih}}</strong> tarihi itibarıyla cari hesabınıza ait mutabakat ve güncel bakiye bilgilerinizi bilginize sunarız.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin:0 0 20px 0;border-collapse:separate;">
              <tr style="background-color:#f8fafc;">
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;width:42%;">Cari Hesap Adı</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;text-align:right;">{{kullanici_adi}}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Cari Kod</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;font-family:monospace;border-bottom:1px solid #e2e8f0;text-align:right;">{{cari_kod}}</td>
              </tr>
              <tr style="background-color:#f8fafc;">
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Mutabakat Tarihi</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:right;">{{tarih}}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;">Bakiye Durumu</td>
                <td style="padding:12px 16px;font-size:13px;color:{{bakiye_rengi}};font-weight:800;text-align:right;">{{bakiye_durumu}}</td>
              </tr>
            </table>
            <div style="background-color:#fdf9f6;border:1.5px solid #ece3de;border-radius:14px;padding:18px 20px;text-align:center;margin:0 0 20px 0;">
              <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Güncel Net Bakiye</div>
              <div style="font-size:22px;font-weight:900;color:{{bakiye_rengi}};letter-spacing:-0.01em;">{{bakiye_etiketi}}</div>
            </div>
            <p style="margin:0;font-size:12.5px;color:#64748b;line-height:1.65;">
              Kayıtlarımızla ilgili herhangi bir farklılık tespit etmeniz halinde 7 iş günü içerisinde
              <a href="mailto:info@pekefe.com" style="color:#6b1d2f;font-weight:700;text-decoration:none;">info@pekefe.com</a>
              adresinden veya WhatsApp destek hattımızdan muhasebe birimimizle iletişime geçebilirsiniz.
            </p>
          `,
          ctaText: "{{portalLabel}}",
          ctaUrl: "{{portalUrl}}",
        })
      },
      ekstre: {
        name: "Cari Hesap Ekstre Gönderimi",
        subject: "Cari Hesap Ekstresi — {{tarih}} | PEKEFE",
        variables: "kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres,portalUrl,portalLabel",
        bodyHtml: wrapPekefeEmail({
          subtitle: "CARİ HESAP EKSTRE BİLDİRİMİ",
          badge: "Hesap Özeti",
          title: "Cari Hesap Ekstresi",
          bodyHtml: `
            <p style="margin:0 0 12px 0;font-size:15px;color:#1e293b;">Sayın <strong>{{yetkili}}</strong>,</p>
            <p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.7;"><strong>{{tarih}}</strong> tarihi itibarıyla cari hesabınıza ait güncel bakiye özeti aşağıda yer almaktadır.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin:0 0 20px 0;border-collapse:separate;">
              <tr style="background-color:#f8fafc;">
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;width:42%;">Cari Hesap Adı</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;text-align:right;">{{kullanici_adi}}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Cari Kod</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;font-family:monospace;border-bottom:1px solid #e2e8f0;text-align:right;">{{cari_kod}}</td>
              </tr>
              <tr style="background-color:#f8fafc;">
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;">Bakiye Durumu</td>
                <td style="padding:12px 16px;font-size:13px;color:{{bakiye_rengi}};font-weight:800;text-align:right;">{{bakiye_durumu}}</td>
              </tr>
            </table>
            <div style="background-color:#fdf9f6;border:1.5px solid #ece3de;border-radius:14px;padding:18px 20px;text-align:center;margin:0 0 12px 0;">
              <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Güncel Net Bakiye</div>
              <div style="font-size:22px;font-weight:900;color:{{bakiye_rengi}};">{{bakiye_etiketi}}</div>
            </div>
          `,
          ctaText: "{{portalLabel}}",
          ctaUrl: "{{portalUrl}}",
        })
      },
      admin_new_order: {
        name: "Yeni Sipariş Bildirimi (Yönetici)",
        subject: "🚨 Yeni Sipariş Alındı! — Sipariş No: {{siparis_no}}",
        variables: "kullanici_adi,siparis_no,siparis_tutari,odeme_yontemi,detay_linki,tarih,siparis_icerik",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE ADMİN</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Yönetici Bildirim Servisi</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">🚨 Yeni Sipariş Alındı!</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Merhaba Yönetici,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">{{tarih}} tarihinde yeni bir sipariş aldınız. Detaylar aşağıdadır:</p>
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 45%;">Müşteri:</td>
                    <td style="padding: 6px 0;">{{kullanici_adi}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Sipariş Numarası:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #6b1d2f;">{{siparis_no}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Sipariş Tutarı:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #15803d;">₺{{siparis_tutari}}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{detay_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Sipariş Yönetimine Git</a>
              </div>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">Pekefe Yönetim Paneli.</p>
            </div>
          </div>
        `
      },
      cargo_shipped: {
        name: "Siparişiniz Kargoya Verildi",
        subject: "Siparişiniz Kargoya Verildi — Sipariş No: #{{siparis_no}} 🚚",
        variables: "kullanici_adi,siparis_no,kargo_sirketi,takip_no,tarih,detay_linki",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Kargo Bilgilendirmesi</p>
            </div>
            <div style="padding: 36px 32px;">
              <p style="color: #1e293b; font-size: 15px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;"><strong>#{{siparis_no}}</strong> numaralı siparişiniz özenle paketlenerek kargoya teslim edilmiştir.</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin: 22px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr><td style="padding: 6px 0; color: #64748b;">Kargo Firması</td><td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">{{kargo_sirketi}}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Takip Numarası</td><td style="padding: 6px 0; color: #6b1d2f; font-weight: 800; font-family: monospace; text-align: right;">{{takip_no}}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Tarih</td><td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">{{tarih}}</td></tr>
                </table>
              </div>
              <div style="text-align: center; margin: 26px 0 12px 0;">
                <a href="{{detay_linki}}" style="display: inline-block; background-color: #6b1d2f; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 999px;">Siparişimi Takip Et</a>
              </div>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler.</p>
            </div>
          </div>
        `
      },
      forgot_password: {
        name: "Şifre Sıfırlama Talebi",
        subject: "PEKEFE — Şifre Sıfırlama Talebiniz",
        variables: "kullanici_adi,sifirlama_linki,sifirlama_kodu",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Hesap Güvenliği</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #1e293b; font-size: 15px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;">Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki doğrulama kodunu veya bağlantıyı kullanarak yeni şifrenizi belirleyebilirsiniz:</p>
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: 900; letter-spacing: 0.2em; color: #6b1d2f; font-family: monospace;">{{sifirlama_kodu}}</span>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="{{sifirlama_linki}}" style="display: inline-block; background-color: #6b1d2f; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 999px;">Şifremi Sıfırla</a>
              </div>
            </div>
          </div>
        `
      },
      password_changed: {
        name: "Şifreniz Güncellendi",
        subject: "PEKEFE — Hesap Şifreniz Güncellendi",
        variables: "kullanici_adi,tarih",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">PEKEFE</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #1e293b; font-size: 15px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;">Hesabınızın şifresi <strong>{{tarih}}</strong> tarihinde başarıyla güncellenmiştir. Bu işlemi siz gerçekleştirmediyseniz lütfen derhal <a href="mailto:info@pekefe.com" style="color:#6b1d2f;">info@pekefe.com</a> adresinden bizimle iletişime geçiniz.</p>
            </div>
          </div>
        `
      },
      contact_received: {
        name: "İletişim Mesajınız Alındı",
        subject: "Mesajınız Bize Ulaştı — PEKEFE",
        variables: "kullanici_adi,konu,tarih",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">PEKEFE</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #1e293b; font-size: 15px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;"><strong>{{konu}}</strong> konulu mesajınız {{tarih}} tarihinde ekibimize ulaşmıştır. En kısa sürede size dönüş yapılacaktır.</p>
            </div>
          </div>
        `
      },
      admin_contact_message: {
        name: "Yeni İletişim Formu Mesajı",
        subject: "Yeni İletişim Mesajı: {{konu}} — {{kullanici_adi}}",
        variables: "kullanici_adi,eposta,telefon,konu,mesaj,tarih",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 28px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900;">PEKEFE YÖNETİM</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 4px 0 0 0;">Yeni İletişim Formu Bildirimi</p>
            </div>
            <div style="padding: 28px; font-size: 14px; color: #334155;">
              <p><strong>Gönderen:</strong> {{kullanici_adi}} ({{eposta}})</p>
              <p><strong>Telefon:</strong> {{telefon}}</p>
              <p><strong>Konu:</strong> {{konu}}</p>
              <p><strong>Tarih:</strong> {{tarih}}</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-top: 12px; white-space: pre-wrap;">{{mesaj}}</div>
            </div>
          </div>
        `
      }
    };

    const def = defaultTemplates[eventType.toLowerCase().trim()];
    if (!def) {
      return null;
    }

    // DB'ye arka planda kaydet ama DB hatası/zaman aşımı olursa in-memory şablonu doğrudan döndür!
    prisma.emailTemplate.upsert({
      where: { eventType: eventType.toLowerCase().trim() },
      update: {
        name: def.name,
        subject: def.subject,
        bodyHtml: def.bodyHtml,
        variables: def.variables,
        status: "ACTIVE"
      },
      create: {
        eventType: eventType.toLowerCase().trim(),
        name: def.name,
        subject: def.subject,
        bodyHtml: def.bodyHtml,
        variables: def.variables,
        status: "ACTIVE"
      }
    }).catch(() => {});

    return def;
  }

  /**
   * Replace template variables with full Turkish/English aliasing, production URLs, and corporate branding upgrade
   */
  private compileTemplate(templateStr: string, placeholders: Record<string, any>, recipient: string = ""): string {
    const siteUrl = this.getSiteUrl();
    const p = placeholders || {};
    const nowDateStr = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

    const resolvedName =
      p.kullanici_adi || p.userName || p.name || p.customerName || p.cari_unvan || p.cariUnvan || p.companyName || "Değerli Müşterimiz";
    const resolvedOrderNo = p.siparis_no || p.orderNo || p.orderNumber || "";
    const resolvedTotal = p.siparis_tutari || p.orderTotal || p.paymentAmount || p.refundAmount || "";
    const resolvedCarrier = p.kargo_sirketi || p.kargo_firmasi || p.cargoCompany || p.carrier || "Anlaşmalı Kargo";
    const resolvedTrackingNo = p.takip_no || p.trackingNo || "Hazırlanıyor";
    const resolvedDetailUrl = p.detay_linki || p.orderDetailUrl || `${siteUrl}/hesap`;
    const resolvedTrackingUrl = p.takip_linki || p.trackingUrl || `${siteUrl}/hesap`;
    const resolvedLoginUrl = p.loginUrl || p.aktivasyon_linki || `${siteUrl}/giris`;
    const resolvedPortalUrl = p.portalUrl || p.onay_linki || `${siteUrl}/b2b`;
    const resolvedShopUrl = p.shopUrl || p.catalogUrl || `${siteUrl}/kategoriler`;
    const resolvedVerifyUrl = p.verifyUrl || p.aktivasyon_linki || `${siteUrl}/giris`;
    const resolvedResetUrl = p.resetUrl || p.sifirlama_linki || `${siteUrl}/giris`;
    const resolvedEmail = p.userEmail || p.recipientEmail || p.email || p.eposta || recipient || "";
    const resolvedDate = p.tarih || p.orderDate || p.paymentDate || p.deliveredAt || nowDateStr;
    const resolvedReason = p.iptal_nedeni || p.cancelReason || p.rejectReason || "Operasyonel değerlendirme / müşteri talebi doğrultusunda işlem yapılmıştır.";
    const resolvedCariKod = p.cari_kod || p.cariKod || "PKF-CARI";

    const enriched: Record<string, any> = {
      // Base aliases (both TR & EN)
      kullanici_adi: resolvedName,
      userName: resolvedName,
      name: resolvedName,
      customerName: resolvedName,
      yetkili: p.yetkili || resolvedName,
      cari_unvan: p.cari_unvan || p.cariUnvan || resolvedName,
      cariUnvan: p.cariUnvan || p.cari_unvan || resolvedName,
      companyName: p.companyName || p.cari_unvan || resolvedName,
      cari_kod: resolvedCariKod,
      cariKod: resolvedCariKod,
      userEmail: resolvedEmail,
      recipientEmail: resolvedEmail,
      email: resolvedEmail,
      eposta: resolvedEmail,
      siparis_no: resolvedOrderNo,
      orderNo: resolvedOrderNo,
      orderNumber: resolvedOrderNo,
      siparis_tutari: resolvedTotal,
      orderTotal: resolvedTotal,
      paymentAmount: resolvedTotal,
      refundAmount: resolvedTotal,
      odeme_yontemi: p.odeme_yontemi || p.paymentMethod || p.refundMethod || "Online Ödeme / Havale",
      paymentMethod: p.paymentMethod || p.odeme_yontemi || "Online Ödeme / Havale",
      refundMethod: p.refundMethod || p.odeme_yontemi || "Ödeme Yönteminize İade",
      kargo_sirketi: resolvedCarrier,
      kargo_firmasi: resolvedCarrier,
      cargoCompany: resolvedCarrier,
      carrier: resolvedCarrier,
      kargo_adresi: p.kargo_adresi || p.shippingAddress || "Kayıtlı Teslimat Adresiniz",
      shippingAddress: p.shippingAddress || p.kargo_adresi || "Kayıtlı Teslimat Adresiniz",
      takip_no: resolvedTrackingNo,
      trackingNo: resolvedTrackingNo,
      takip_linki: resolvedTrackingUrl,
      trackingUrl: resolvedTrackingUrl,
      detay_linki: resolvedDetailUrl,
      orderDetailUrl: resolvedDetailUrl,
      loginUrl: resolvedLoginUrl,
      portalUrl: resolvedPortalUrl,
      portalLabel: p.portalLabel || "Hesabım & Ekstre Görüntüle",
      onay_linki: resolvedPortalUrl,
      shopUrl: resolvedShopUrl,
      catalogUrl: resolvedShopUrl,
      verifyUrl: resolvedVerifyUrl,
      aktivasyon_linki: resolvedVerifyUrl,
      resetUrl: resolvedResetUrl,
      sifirlama_linki: resolvedResetUrl,
      contactUrl: p.contactUrl || `${siteUrl}/iletisim`,
      feedbackUrl: p.feedbackUrl || `${siteUrl}/hesap`,
      invoiceUrl: p.invoiceUrl || `${siteUrl}/hesap`,
      adminPanelUrl: p.adminPanelUrl || `${siteUrl}/admin`,
      expiresIn: p.expiresIn || "24 saat",
      estimatedDelivery: p.estimatedDelivery || "1–3 iş günü",
      refundDays: p.refundDays || "1–7 iş günü",
      tarih: resolvedDate,
      orderDate: resolvedDate,
      paymentDate: resolvedDate,
      deliveredAt: resolvedDate,
      iptal_nedeni: resolvedReason,
      cancelReason: resolvedReason,
      rejectReason: resolvedReason,
      bakiye: p.bakiye || "0,00 ₺",
      bakiye_durumu: p.bakiye_durumu || "MUTABIK",
      bakiye_rengi: p.bakiye_rengi || "#475569",
      bakiye_etiketi: p.bakiye_etiketi || `Bakiye: ${p.bakiye || "0,00"} TRY`,
      vade_tarihi: p.vade_tarihi || resolvedDate,
      b2bGroup: p.b2bGroup || "Standart Bayi",
      discountRate: p.discountRate || "15",
      // Explicit caller values always take top precedence
      ...p,
    };

    let result = templateStr || "";
    Object.entries(enriched).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, val !== undefined && val !== null ? String(val) : "");
    });
    result = result.replace(/{{\s*\w+\s*}}/g, "");

    // Rewrite any legacy localhost URLs to live domain
    result = result.replace(/https?:\/\/localhost:\d+/gi, siteUrl);

    // Upgrade any template missing official PEKEFE logo in header (legacy DB templates or mutabakat/inline templates)
    if (result.includes("<h1>🌿 PEKEFE</h1>") && !result.includes("/logo.png")) {
      result = result.replace(
        "<h1>🌿 PEKEFE</h1>",
        `<a href="${siteUrl}" target="_blank" style="text-decoration:none;display:inline-block;"><img src="${siteUrl}/logo.png" alt="PEKEFE İspir Yöresel Ürünler" width="68" height="68" style="display:block;margin:0 auto 12px;border-radius:14px;background:#ffffff;padding:4px;border:2px solid #d4a359;object-fit:contain;" /></a><h1 style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:0.14em;margin:0;">PEKEFE</h1>`
      );
    } else if (!result.includes("/logo.png") && /<h[12][^>]*>(PEKEFE|MUTABAKAT MEKTUBU)/i.test(result)) {
      result = result.replace(
        /(<h[12][^>]*>(?:PEKEFE|MUTABAKAT MEKTUBU))/i,
        `<a href="${siteUrl}" target="_blank" style="text-decoration:none;display:inline-block;"><img src="${siteUrl}/logo.png" alt="PEKEFE İspir Yöresel Ürünler" width="68" height="68" style="display:block;margin:0 auto 12px;border-radius:14px;background:#ffffff;padding:4px;border:2px solid #d4a359;object-fit:contain;" /></a>$1`
      );
    }

    // Upgrade legacy footer if corporate address/WhatsApp is missing
    if (result.includes("<div class=\"footer\">") && !result.includes("Çamlıca Mahallesi")) {
      result = result.replace(
        /<div class="footer">[\s\S]*?<\/div>/i,
        `<div style="background:#fdf9f6;border-top:1px solid #f1e8e3;border-bottom:1px solid #f1e8e3;padding:12px 20px;text-align:center;font-size:11px;font-weight:700;color:#6b1d2f;">%100 Doğal İspir Mahsulü &nbsp;&middot;&nbsp; 256-Bit SSL Güvenli Ödeme &nbsp;&middot;&nbsp; Özenli &amp; Sigortalı Kargo</div>
        <div class="footer" style="background:#260811;color:#e2d5d8;padding:24px 28px;text-align:center;font-size:12px;line-height:1.7;">
          <p style="color:#ffffff;font-weight:800;font-size:13px;letter-spacing:0.06em;margin:0 0 4px;">PEKEFE İSPİR YÖRESEL ÜRÜNLER</p>
          <p style="color:#d6c3c7;font-size:11.5px;margin:0 0 6px;">Çamlıca Mahallesi, 25900 İspir / Erzurum, Türkiye</p>
          <p style="margin:0 0 10px;">
            <a href="tel:+905342709140" style="color:#f5d598;text-decoration:none;font-weight:700;">+90 534 270 91 40</a> &nbsp;&bull;&nbsp;
            <a href="https://wa.me/905342709140" target="_blank" style="color:#86efac;text-decoration:none;font-weight:700;">WhatsApp Destek</a> &nbsp;&bull;&nbsp;
            <a href="mailto:info@pekefe.com" style="color:#f5d598;text-decoration:none;font-weight:700;">info@pekefe.com</a>
          </p>
          <p style="margin:10px 0 6px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;">
            <a href="${siteUrl}/kategoriler" style="color:#ffffff;text-decoration:none;margin:0 8px;">Mağaza</a>
            <a href="${siteUrl}/hesap" style="color:#ffffff;text-decoration:none;margin:0 8px;">Hesabım</a>
            <a href="${siteUrl}/teslimat" style="color:#ffffff;text-decoration:none;margin:0 8px;">Teslimat &amp; İade</a>
            <a href="${siteUrl}/iletisim" style="color:#ffffff;text-decoration:none;margin:0 8px;">İletişim</a>
          </p>
          <p style="color:#a89096;font-size:10.5px;margin:6px 0 0;">&copy; ${new Date().getFullYear()} PEKEFE İspir Yöresel Ürünler. Tüm hakları saklıdır. &nbsp;|&nbsp; <a href="${siteUrl}" style="color:#f5d598;text-decoration:none;">www.pekefe.com</a></p>
        </div>`
      );
    }

    return result;
  }

  /**
   * Adds an email with dynamic placeholders to the queue AND sends directly/instantly.
   */
  public async queueEmail(
    recipient: string,
    eventType: string,
    placeholders: Record<string, any>,
    maxRetries = 3
  ): Promise<string> {
    const cleanEventType = eventType.toLowerCase().trim();
    if (!recipient || !recipient.includes("@")) {
      console.warn(`[EmailNotificationService] Invalid recipient email address: ${recipient}`);
      return "invalid_email";
    }

    let subject = "";
    let bodyHtml = "";

    // 1. Try resolving template from DB with timeout (match both lowercase & uppercase eventType)
    try {
      const dbTemplate = await withTimeout(
        prisma.emailTemplate.findFirst({
          where: {
            OR: [
              { eventType: cleanEventType },
              { eventType: cleanEventType.toUpperCase() },
            ],
            status: "ACTIVE",
          },
        }),
        2000,
        null as any
      );
      if (dbTemplate) {
        const isLegacyMutabakatOrEkstre =
          (cleanEventType === "mutabakat" || cleanEventType === "ekstre") &&
          (!dbTemplate.bodyHtml.includes("Çamlıca Mahallesi") ||
            !dbTemplate.bodyHtml.includes("{{bakiye_etiketi}}"));
        if (!isLegacyMutabakatOrEkstre) {
          subject = dbTemplate.subject;
          bodyHtml = dbTemplate.bodyHtml;
        }
      }
    } catch {}

    // 2. Fallback to in-memory default template
    if (!subject || !bodyHtml) {
      try {
        const seeded = await this.seedDefaultTemplate(cleanEventType);
        if (seeded) {
          subject = seeded.subject;
          bodyHtml = seeded.bodyHtml;
        }
      } catch {}
    }

    if (!subject || !bodyHtml) {
      subject = `PEKEFE Bilgilendirme — ${cleanEventType.toUpperCase()}`;
      bodyHtml = `<p>Merhaba {{kullanici_adi}}, işleminiz başarıyla tamamlanmıştır.</p>`;
    }

    const compiledSubject = this.compileTemplate(subject, placeholders, recipient);
    const compiledBody = this.compileTemplate(bodyHtml, placeholders, recipient);

    // 3. DIRECT INSTANT SEND (with 1 automatic retry on transient SMTP glitch)
    const attemptSend = async () => {
      const { transporter, fromEmail, fromName } = this.getTransporter();
      try {
        return await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: recipient,
          subject: compiledSubject,
          html: compiledBody,
        });
      } finally {
        try { transporter.close(); } catch {}
      }
    };

    try {
      let info: any;
      try {
        info = await attemptSend();
      } catch (firstErr: any) {
        console.warn(`[EmailNotificationService] First send attempt failed for ${recipient}, retrying once:`, firstErr?.message || firstErr);
        await new Promise(r => setTimeout(r, 1200));
        info = await attemptSend();
      }

      console.log(`[EmailNotificationService] ✅ EMAIL SENT to ${recipient} [${cleanEventType}] (MessageID: ${info.messageId})`);

      // Async non-blocking log
      prisma.emailLog.create({
        data: {
          recipient,
          subject: compiledSubject,
          bodyHtml: compiledBody,
          eventType: cleanEventType,
          status: "SENT",
          retryCount: 0,
        },
      }).catch(() => {});

      return info.messageId || "sent_ok";
    } catch (sendErr: any) {
      console.error(`[EmailNotificationService] ❌ Email send failed to ${recipient} [${cleanEventType}]:`, sendErr?.message || sendErr);

      try {
        const log = await prisma.emailLog.create({
          data: {
            recipient,
            subject: compiledSubject,
            bodyHtml: compiledBody,
            eventType: cleanEventType,
            status: "FAILED",
            retryCount: 1,
            errorMessage: sendErr?.message || "Direct send error"
          },
        });
        return log.id;
      } catch {
        return "error_logged";
      }
    }
  }

  /**
   * Processes all pending emails in the queue
  /**
   * Sends a custom branded HTML email immediately using live SMTP and records it in EmailLog.
   */
  public async sendCustomHtmlEmail(
    recipient: string,
    subject: string,
    bodyHtml: string,
    eventType = "RETENTION"
  ): Promise<{ success: boolean; error?: string }> {
    let logId: string | null = null;
    try {
      const log = await prisma.emailLog.create({
        data: {
          recipient,
          subject,
          bodyHtml,
          eventType,
          status: "PENDING",
        },
      });
      logId = log.id;
    } catch {}

    try {
      const { transporter, fromEmail, fromName } = this.getTransporter();
      try {
        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: recipient,
          subject,
          html: bodyHtml,
        });
      } finally {
        try { transporter.close(); } catch {}
      }

      if (logId) {
        await prisma.emailLog.update({
          where: { id: logId },
          data: { status: "SENT" },
        }).catch(() => {});
      }
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || "SMTP gonderim hatasi";
      if (logId) {
        await prisma.emailLog.update({
          where: { id: logId },
          data: { status: "FAILED", errorMessage: msg },
        }).catch(() => {});
      }
      return { success: false, error: msg };
    }
  }

  /**
   * Process pending emails in the EmailLog queue
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingEmails = await prisma.emailLog.findMany({
        where: { status: "PENDING" },
        take: 20,
        orderBy: { createdAt: "asc" },
      });

      for (const email of pendingEmails) {
        try {
          const { transporter, fromEmail, fromName } = this.getTransporter();
          try {
            await transporter.sendMail({
              from: `"${fromName}" <${fromEmail}>`,
              to: email.recipient,
              subject: email.subject,
              html: email.bodyHtml,
            });
          } finally {
            try { transporter.close(); } catch {}
          }

          await prisma.emailLog.update({
            where: { id: email.id },
            data: {
              status: "SENT",
            },
          });
        } catch (sendError: any) {
          const nextRetry = email.retryCount + 1;
          await prisma.emailLog.update({
            where: { id: email.id },
            data: {
              retryCount: nextRetry,
              status: nextRetry >= 3 ? "FAILED" : "PENDING",
              errorMessage: sendError?.message || "Send failed",
            },
          });
        }
      }
    } catch (queueError) {
      console.error("[EmailNotificationService] Error processing email queue:", queueError);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const emailNotificationService = new EmailNotificationService();
