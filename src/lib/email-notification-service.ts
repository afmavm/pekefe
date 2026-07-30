import { prisma } from "./prisma";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { getLiveEnv } from "./env-helper";

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
  private transporter: nodemailer.Transporter | null = null;
  private isProcessing = false;
  private lastConfig = "";

  constructor() {}

  /**
   * Dynamically build transporter based on current process.env
   */
  private getTransporter(): nodemailer.Transporter {
    const host = getLiveEnv("SMTP_HOST", "smtp.turkticaret.net");
    const portStr = getLiveEnv("SMTP_PORT", "587");
    const port = Number(portStr) || 587;
    const user = getLiveEnv("SMTP_USER", "");
    const pass = getLiveEnv("SMTP_PASS", "");
    const secureStr = getLiveEnv("SMTP_SECURE", "false");
    const secure = secureStr === "true";

    const currentConfig = `${host}-${port}-${user}-${pass}-${secure}`;
    if (!this.transporter || this.lastConfig !== currentConfig) {
      if (this.transporter) {
        try {
          this.transporter.close();
        } catch (err) {
          console.error("[EmailNotificationService] Error closing old transporter:", err);
        }
      }
      this.transporter = nodemailer.createTransport({
        pool: true,
        host: host,
        port: port,
        secure: secure,
        auth: {
          user: user,
          pass: pass,
        },
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10,
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.lastConfig = currentConfig;
      console.log("[EmailNotificationService] Nodemailer transporter initialized dynamically.");
    }
    return this.transporter;
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
                <a href="http://localhost:3000/magaza" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Ürünleri Keşfet</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Sorularınız için bu e-postaya yanıt verebilir veya info@pekefe.com adresimizden bize ulaşabilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Traditional Excellence. Tüm hakları saklıdır.</p>
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
        variables: "kullanici_adi,siparis_no,siparis_tutari,detay_linki",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Sipariş Onayı</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Siparişiniz Başarıyla Alındı!</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Siparişiniz sistemimize ulaşmış ve hazırlık sürecine alınmıştır. Pekefe'yi tercih ettiğiniz için teşekkür ederiz.</p>
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 45%;">Sipariş Numarası:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #6b1d2f;">{{siparis_no}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Sipariş Tutarı:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #15803d;">₺{{siparis_tutari}}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{detay_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Sipariş Detaylarını Görüntüle</a>
              </div>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Traditional Excellence.</p>
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
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Traditional Excellence.</p>
            </div>
          </div>
        `
      },
      mutabakat: {
        name: "Cari Hesap Mutabakat Mektubu",
        subject: "Cari Hesap Mutabakat Talebi — {{tarih}} | Pekefe",
        variables: "kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres",
        bodyHtml: `
          <!DOCTYPE html>
          <html lang="tr">
          <head><meta charset="UTF-8"><title>Mutabakat Mektubu</title></head>
          <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
              <tr><td align="center">
                <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#6b1d2f 0%,#3b0a18 100%);padding:36px 40px;text-align:center;">
                      <p style="margin:0 0 4px 0;font-size:11px;color:#fef3c7;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">PEKEFE GERÇEK HASAT</p>
                      <h1 style="margin:0 0 4px 0;font-size:26px;color:#ffffff;font-weight:900;">MUTABAKAT MEKTUBU</h1>
                      <p style="margin:0;font-size:11px;color:#fef3c7;letter-spacing:0.1em;text-transform:uppercase;">Cari Hesap Bakiye Bilgilendirmesi</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 40px;">
                      <p style="font-size:15px;color:#334155;line-height:1.8;">Sayın <strong style="color:#1e293b;">{{yetkili}}</strong>,</p>
                      <p style="font-size:15px;color:#475569;line-height:1.8;">Firmamız kayıtlarına göre <strong>{{tarih}}</strong> tarihi itibarıyla cari hesap mutabakat bilgilerinizi sunuyoruz.</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:24px 0;">
                        <tr style="background-color:#f8fafc;">
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;">Cari Hesap Adı</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;">{{kullanici_adi}}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;">Cari Kod</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;font-family:monospace;">{{cari_kod}}</td>
                        </tr>
                      </table>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="http://localhost:3000/b2b" style="background:linear-gradient(135deg,#6b1d2f,#8b2d3f);color:#ffffff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;display:inline-block;box-shadow:0 4px 12px rgba(107,29,47,0.25);">🔐 Bayi Portalına Giriş Yap</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#fcf8f6;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Pekefe Traditional Excellence.</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `
      },
      ekstre: {
        name: "Cari Hesap Ekstre Gönderimi",
        subject: "Cari Hesap Ekstresi — {{tarih}} | Pekefe",
        variables: "kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres",
        bodyHtml: `
          <!DOCTYPE html>
          <html lang="tr">
          <head><meta charset="UTF-8"><title>Ekstre Bilgilendirmesi</title></head>
          <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
              <tr><td align="center">
                <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#6b1d2f 0%,#3b0a18 100%);padding:36px 40px;text-align:center;">
                      <p style="margin:0 0 4px 0;font-size:11px;color:#fef3c7;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">PEKEFE GERÇEK HASAT</p>
                      <h1 style="margin:0 0 4px 0;font-size:26px;color:#ffffff;font-weight:900;">CARİ HESAP EKSTRESİ</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 40px;">
                      <p style="font-size:15px;color:#334155;line-height:1.8;">Sayın <strong style="color:#1e293b;">{{yetkili}}</strong>,</p>
                      <p style="font-size:15px;color:#475569;line-height:1.8;"><strong>{{tarih}}</strong> tarihi itibarıyla cari hesabınıza ait bakiye bilgileri aşağıda yer almaktadır.</p>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="http://localhost:3000/b2b" style="background:linear-gradient(135deg,#6b1d2f,#8b2d3f);color:#ffffff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;display:inline-block;box-shadow:0 4px 12px rgba(107,29,47,0.25);">📋 Hesap Hareketlerimi Görüntüle</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#fcf8f6;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Pekefe Traditional Excellence.</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `
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
      }
    };

    const def = defaultTemplates[eventType.toLowerCase().trim()];
    if (!def) {
      throw new Error(`Default template not found for event: ${eventType}`);
    }

    const created = await prisma.emailTemplate.upsert({
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
    });

    console.log(`[EmailNotificationService] Upserted default template for eventType: ${eventType}`);
    return created;
  }

  /**
   * Adds an email with dynamic placeholders to the database queue.
   */
  public async queueEmail(
    recipient: string,
    eventType: string,
    placeholders: Record<string, any>,
    maxRetries = 3
  ): Promise<string> {
    const cleanEventType = eventType.toLowerCase().trim();

    let template = await prisma.emailTemplate.findUnique({
      where: { eventType: cleanEventType },
    });

    try {
      template = await this.seedDefaultTemplate(cleanEventType);
    } catch (seedErr: any) {
      if (!template) {
        console.error(`[EmailNotificationService] Failed to upsert template for ${eventType}:`, seedErr);
      }
    }

    if (!template) {
      throw new Error(`Email template for event ${eventType} could not be resolved.`);
    }

    if (template.status !== "ACTIVE") {
      throw new Error(`Email template for event ${eventType} is currently inactive.`);
    }

    const compiledSubject = this.compileTemplate(template.subject, placeholders);
    const compiledBody = this.compileTemplate(template.bodyHtml, placeholders);

    const log = await prisma.emailLog.create({
      data: {
        recipient,
        subject: compiledSubject,
        bodyHtml: compiledBody,
        eventType: cleanEventType,
        status: "PENDING",
        retryCount: 0,
      },
    });

    await this.processQueue();

    return log.id;
  }

  /**
   * Replace template variables
   */
  private compileTemplate(templateStr: string, placeholders: Record<string, any>): string {
    let result = templateStr;
    Object.entries(placeholders).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, val !== undefined && val !== null ? String(val) : "");
    });
    result = result.replace(/{{\s*\w+\s*}}/g, "");
    return result;
  }

  /**
   * Processes all pending emails in the queue
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
          const transporter = this.getTransporter();
          const fromEmail = getLiveEnv("SMTP_USER", "info@pekefe.com");
          const fromName = getLiveEnv("SMTP_FROM_NAME", "Pekefe");

          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: email.recipient,
            subject: email.subject,
            html: email.bodyHtml,
          });

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
