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

  constructor() {
    // Initial initialization (will run on first demand)
  }

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
        pool: true, // SMTP Connection Pooling Active
        host: host,
        port: port,
        secure: secure, // true for 465, false for 587
        auth: {
          user: user,
          pass: pass,
        },
        maxConnections: 5, // max concurrent open SMTP sockets
        maxMessages: 100,  // max messages before closing the socket
        rateLimit: 10,     // rate limit messages per second
        tls: {
          rejectUnauthorized: false, // allow self-signed certificates if needed
        },
      });
      this.lastConfig = currentConfig;
      console.log("[EmailNotificationService] Nodemailer transporter initialized/recreated dynamically.");
    }
    return this.transporter;
  }

  /**
   * Dynamically seeds a default template if not found in database.
   */
  private async seedDefaultTemplate(eventType: string): Promise<any> {
    const defaultTemplates: Record<string, { name: string; subject: string; bodyHtml: string; variables: string }> = {
      welcome: {
        name: "Hoş Geldiniz (B2C)",
        subject: "Atak Arıcılık'a Hoş Geldiniz!",
        variables: "kullanici_adi",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; tracking-wide">ATAK ARICILIK</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Profesyonel Arıcılık Malzemeleri</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
            <h3 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Aramıza Hoş Geldiniz!</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Atak Arıcılık ailesine başarıyla katıldınız. Hesabınız aktifleştirilmiştir. Web sitemiz üzerinden en kaliteli arıcılık ekipmanlarını inceleyebilir ve sipariş verebilirsiniz.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://atakaricilik.com" style="background-color: #ea580c; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">Alışverişe Başla</a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Herhangi bir sorunuz veya yardıma ihtiyacınız olursa, WhatsApp destek hattımızdan veya bu e-postaya yanıt vererek bizimle iletişime geçebilirsiniz.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen doğrudan yanıtlamayınız. © ${new Date().getFullYear()} Atak Arıcılık.</p>
          </div>
        `
      },
      dealer_applied: {
        name: "Bayilik Başvurusu Alındı (B2B)",
        subject: "Bayilik Başvurunuz Alındı - Atak B2B",
        variables: "kullanici_adi",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; tracking-wide">ATAK B2B PORTALI</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Bayi İşlem Merkezi</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
            <h3 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">Bayilik Başvurunuz Başarıyla Alındı</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Atak Arıcılık B2B sistemine yapmış olduğunuz bayilik başvurusu kayıtlarımıza girmiştir. Başvurunuz yetkililerimiz tarafından incelenmektedir.</p>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;"><strong>Başvuru Durumu:</strong> İncelemede</p>
              <p style="margin: 8px 0 0 0; color: #475569; font-size: 13px; line-height: 1.5;">Başvurunuz onaylandığında, fiyat gruplarınız ve bayi yetkileriniz tanımlanarak tarafınıza bilgilendirme e-postası gönderilecektir.</p>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Gösterdiğiniz ilgi için teşekkür ederiz.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Bu e-posta sistem tarafından otomatik oluşturulmuştur. © ${new Date().getFullYear()} Atak Arıcılık.</p>
          </div>
        `
      },
      dealer_approved: {
        name: "Bayilik Başvurusu Onaylandı (B2B)",
        subject: "Bayilik Başvurunuz Onaylandı! - Atak B2B",
        variables: "kullanici_adi,bayi_grubu,fiyat_grubu,kredi_limiti",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; tracking-wide">ATAK B2B PORTALI</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Tebrikler!</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
            <h3 style="color: #16a34a; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Bayiliğiniz Aktif Edildi!</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 24px;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Atak Arıcılık B2B portalı bayilik başvurunuz başarıyla onaylanmış ve yetkileriniz aktif edilmiştir. Cari hesabınıza ait tanımlamalar aşağıda belirtilmiştir:</p>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 45%;">Bayi Grubu:</td>
                  <td style="padding: 6px 0;">{{bayi_grubu}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Fiyat Grubu:</td>
                  <td style="padding: 6px 0;">{{fiyat_grubu}} Fiyatı</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Kredi Limiti:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #16a34a;">₺{{kredi_limiti}}</td>
                </tr>
              </table>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Bayi portalına giriş yapmak, özel iskonto oranlarıyla sipariş vermek ve cari hareketlerinizi incelemek için aşağıdaki bağlantıyı kullanabilirsiniz:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://atakaricilik.com/login" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);">Bayi Portalına Giriş Yap</a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Hayırlı işler, bol kazançlar dileriz.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Atak Arıcılık B2B Destek Ekibi.</p>
          </div>
        `
      },
      dealer_rejected: {
        name: "Bayilik Başvurusu Reddedildi (B2B)",
        subject: "Bayilik Başvurusu Hakkında - Atak B2B",
        variables: "kullanici_adi",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; tracking-wide">ATAK B2B PORTALI</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Bilgilendirme</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
            <h3 style="color: #b91c1c; margin-top: 0; font-size: 18px; font-weight: 700;">Bayilik Başvurunuz Hakkında</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Atak Arıcılık B2B portalı bayilik başvurunuz incelenmiş olup, üzülerek belirtmek isteriz ki mevcut kriterler doğrultusunda başvurunuz şu aşamada onaylanamamıştır.</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Farklı ticari talepleriniz veya detaylı bilgi almak için bizimle doğrudan iletişime geçebilirsiniz.</p>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Gösterdiğiniz ilgi için teşekkür ederiz.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Atak Arıcılık Yönetim Ekibi.</p>
          </div>
        `
      },
      order_received: {
        name: "Sipariş Alındı (Sipariş Onayı)",
        subject: "Siparişiniz Alındı - Sipariş No: {{siparis_no}}",
        variables: "kullanici_adi,siparis_no,siparis_tutari,detay_linki",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; tracking-wide">ATAK ARICILIK</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Sipariş Bilgilendirme</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
            <h3 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Siparişiniz Başarıyla Alındı!</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 24px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Siparişiniz sistemimize ulaşmış ve hazırlık sürecine alınmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 45%;">Sipariş Numarası:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #ea580c;">{{siparis_no}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Sipariş Tutarı:</td>
                  <td style="padding: 6px 0; font-weight: bold;">₺{{siparis_tutari}}</td>
                </tr>
              </table>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Siparişinizin durumunu takip etmek ve faturanızı görüntülemek için aşağıdaki bağlantıyı kullanabilirsiniz:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{detay_linki}}" style="background-color: #ea580c; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">Sipariş Detaylarını Görüntüle</a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Siparişiniz kargoya teslim edildiğinde ayrıca takip numarası içeren bilgilendirme e-postası alacaksınız.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Bu e-posta sistem tarafından otomatik gönderilmiştir. © Atak Arıcılık.</p>
          </div>
        `
      },
      forgot_password: {
        name: "Şifre Sıfırlama Talebi",
        subject: "Şifre Sıfırlama Talebi - Atak Arıcılık",
        variables: "kullanici_adi,sifirlama_linki",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; tracking-wide">ATAK ARICILIK</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Hesap Güvenliği</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
            <h3 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">Şifre Sıfırlama Talebi</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre oluşturmak için lütfen aşağıdaki bağlantıyı tıklayın:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{sifirlama_linki}}" style="background-color: #ea580c; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">Yeni Şifre Oluştur</a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız. Şifreniz güvende kalacaktır.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Bu e-posta güvenlik gereği otomatik gönderilmiştir. © Atak Arıcılık.</p>
          </div>
        `
      },
      mutabakat: {
        name: "Cari Hesap Mutabakat Mektubu",
        subject: "Cari Hesap Mutabakat Talebi — {{tarih}} | Atak Arıcılık",
        variables: "kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres",
        bodyHtml: `
          <!DOCTYPE html>
          <html lang="tr">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Mutabakat Mektubu</title></head>
          <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 0;">
              <tr><td align="center">
                <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                  <!-- ÜST BAŞLIK / HEADER -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%);padding:32px 40px;text-align:center;">
                      <p style="margin:0 0 4px 0;font-size:11px;color:#fde68a;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">ATAK ARICILIK</p>
                      <h1 style="margin:0 0 4px 0;font-size:26px;color:#ffffff;font-weight:900;letter-spacing:0.02em;">MUTABAKAT MEKTUBU</h1>
                      <p style="margin:0;font-size:11px;color:#fde68a;letter-spacing:0.1em;text-transform:uppercase;">Hesap Mutabakatı & Bakiye Bilgilendirmesi</p>
                    </td>
                  </tr>

                  <!-- TARİH BANDI -->
                  <tr>
                    <td style="background-color:#fffbeb;border-bottom:2px solid #fde68a;padding:10px 40px;text-align:right;">
                      <span style="font-size:12px;color:#92400e;font-weight:700;">📅 Mutabakat Tarihi: {{tarih}}</span>
                    </td>
                  </tr>

                  <!-- İÇERİK -->
                  <tr>
                    <td style="padding:36px 40px;">

                      <p style="font-size:15px;color:#334155;line-height:1.8;margin:0 0 20px 0;">
                        Sayın <strong style="color:#1e293b;">{{yetkili}}</strong>,
                      </p>
                      <p style="font-size:15px;color:#475569;line-height:1.8;margin:0 0 28px 0;">
                        Firmamız kayıtlarına göre <strong>{{tarih}}</strong> tarihi itibarıyla aşağıdaki tabloda yer alan
                        cari hesap bilgilerinizi müzakere ve mutabakat amacıyla tarafınıza sunuyoruz.
                      </p>

                      <!-- CARİ BİLGİ TABLOSU -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                        <tr style="background-color:#f8fafc;">
                          <td colspan="2" style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                            <span style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">🏢 Cari Hesap Bilgileri</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #f1f5f9;width:42%;">Cari Hesap Adı</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;border-bottom:1px solid #f1f5f9;">{{kullanici_adi}}</td>
                        </tr>
                        <tr style="background-color:#fafafa;">
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #f1f5f9;">Cari Hesap Kodu</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;font-family:monospace;border-bottom:1px solid #f1f5f9;">{{cari_kod}}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #f1f5f9;">Yetkili Kişi</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;border-bottom:1px solid #f1f5f9;">{{yetkili}}</td>
                        </tr>
                        <tr style="background-color:#fafafa;">
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #f1f5f9;">Telefon</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;border-bottom:1px solid #f1f5f9;">{{telefon}}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;">Vade Süresi</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;">{{vade_gun}}</td>
                        </tr>
                      </table>

                      <!-- BAKİYE KARTI -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;overflow:hidden;margin-bottom:28px;border:2px solid {{bakiye_rengi}};">
                        <tr>
                          <td style="background-color:{{bakiye_rengi}};padding:16px 24px;text-align:center;">
                            <p style="margin:0;font-size:11px;color:#ffffff;opacity:0.85;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">📊 GÜNCEL HESAP BAKİYESİ</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:24px;text-align:center;background-color:#fff;">
                            <p style="margin:0 0 6px 0;font-size:32px;font-weight:900;color:{{bakiye_rengi}};">{{bakiye}} TRY</p>
                            <span style="display:inline-block;padding:4px 16px;background-color:{{bakiye_rengi}};color:#fff;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.08em;">{{bakiye_durumu}}</span>
                          </td>
                        </tr>
                      </table>

                      <!-- AÇIKLAMA METNİ -->
                      <div style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
                        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.7;">
                          <strong>⚠️ Önemli Not:</strong> Yukarıdaki bakiye firmamız muhasebe kayıtlarına dayanmaktadır. 
                          Tarafınızca mutabık olunması halinde bu e-postayı yanıtlamanız yeterlidir. 
                          Herhangi bir itirazınız veya ekstre talebi için muhasebe birimimizle 
                          <strong>en geç 7 iş günü</strong> içinde iletişime geçmenizi rica ederiz.
                        </p>
                      </div>

                      <!-- PORTAL BUTONU -->
                      <div style="text-align:center;margin:32px 0;">
                        <a href="https://atakaricilik.com/login" style="background:linear-gradient(135deg,#b45309,#d97706);color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;display:inline-block;letter-spacing:0.03em;box-shadow:0 4px 12px rgba(180,83,9,0.35);">
                          🔐 Bayi Portalına Giriş Yap
                        </a>
                        <p style="margin:12px 0 0 0;font-size:12px;color:#94a3b8;">Cari hareketlerinizi, ekstre detaylarınızı ve faturalarınızı portaldan inceleyebilirsiniz.</p>
                      </div>

                      <!-- ALT BİLGİ -->
                      <hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0;" />
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size:12px;color:#64748b;">
                            <strong style="color:#1e293b;">Atak Arıcılık</strong><br/>
                            Muhasebe & Finans Departmanı<br/>
                            📧 muhasebe@atakaricilik.com
                          </td>
                          <td align="right" style="font-size:11px;color:#94a3b8;vertical-align:top;">
                            Bu e-posta otomatik<br/>olarak oluşturulmuştur.<br/>
                            © ${new Date().getFullYear()} Atak Arıcılık
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- ALT ŞERİT -->
                  <tr>
                    <td style="background-color:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">
                        Bu mutabakat mektubu <strong>{{tarih}}</strong> tarihinde Atak Arıcılık ERP sistemi tarafından otomatik oluşturulmuştur.
                      </p>
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
        subject: "Cari Hesap Ekstre Bilgilendirmesi — {{tarih}} | Atak Arıcılık",
        variables: "kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres",
        bodyHtml: `
          <!DOCTYPE html>
          <html lang="tr">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ekstre Bilgilendirmesi</title></head>
          <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 0;">
              <tr><td align="center">
                <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                  <!-- HEADER -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 60%,#2563eb 100%);padding:32px 40px;text-align:center;">
                      <p style="margin:0 0 4px 0;font-size:11px;color:#bfdbfe;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">ATAK ARICILIK</p>
                      <h1 style="margin:0 0 4px 0;font-size:26px;color:#ffffff;font-weight:900;letter-spacing:0.02em;">CARİ HESAP EKSTRESİ</h1>
                      <p style="margin:0;font-size:11px;color:#bfdbfe;letter-spacing:0.1em;text-transform:uppercase;">Hesap Hareketleri Bilgilendirmesi</p>
                    </td>
                  </tr>

                  <!-- TARİH BANDI -->
                  <tr>
                    <td style="background-color:#eff6ff;border-bottom:2px solid #bfdbfe;padding:10px 40px;text-align:right;">
                      <span style="font-size:12px;color:#1d4ed8;font-weight:700;">📅 Ekstre Tarihi: {{tarih}}</span>
                    </td>
                  </tr>

                  <!-- İÇERİK -->
                  <tr>
                    <td style="padding:36px 40px;">

                      <p style="font-size:15px;color:#334155;line-height:1.8;margin:0 0 20px 0;">
                        Sayın <strong style="color:#1e293b;">{{yetkili}}</strong>,
                      </p>
                      <p style="font-size:15px;color:#475569;line-height:1.8;margin:0 0 28px 0;">
                        <strong>{{tarih}}</strong> tarihi itibarıyla cari hesabınıza ait güncel bakiye bilgileri 
                        aşağıda yer almaktadır. Tüm hareket detaylarınıza bayi portalımızdan ulaşabilirsiniz.
                      </p>

                      <!-- CARİ BİLGİ TABLOSU -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                        <tr style="background-color:#f8fafc;">
                          <td colspan="2" style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                            <span style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">🏢 Cari Hesap Bilgileri</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #f1f5f9;width:42%;">Cari Hesap Adı</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;border-bottom:1px solid #f1f5f9;">{{kullanici_adi}}</td>
                        </tr>
                        <tr style="background-color:#fafafa;">
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #f1f5f9;">Cari Hesap Kodu</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;font-family:monospace;border-bottom:1px solid #f1f5f9;">{{cari_kod}}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #f1f5f9;">Yetkili Kişi</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;border-bottom:1px solid #f1f5f9;">{{yetkili}}</td>
                        </tr>
                        <tr style="background-color:#fafafa;">
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #f1f5f9;">Telefon</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;border-bottom:1px solid #f1f5f9;">{{telefon}}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;">Ödeme Vadesi</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;">{{vade_gun}}</td>
                        </tr>
                      </table>

                      <!-- BAKİYE KARTI -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;overflow:hidden;margin-bottom:28px;border:2px solid {{bakiye_rengi}};">
                        <tr>
                          <td style="background-color:{{bakiye_rengi}};padding:16px 24px;text-align:center;">
                            <p style="margin:0;font-size:11px;color:#ffffff;opacity:0.85;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">📊 NET HESAP BAKİYESİ</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:24px;text-align:center;background-color:#fff;">
                            <p style="margin:0 0 6px 0;font-size:32px;font-weight:900;color:{{bakiye_rengi}};">{{bakiye}} TRY</p>
                            <span style="display:inline-block;padding:4px 16px;background-color:{{bakiye_rengi}};color:#fff;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.08em;">{{bakiye_durumu}}</span>
                          </td>
                        </tr>
                      </table>

                      <!-- BİLGİLENDİRME NOTU -->
                      <div style="background-color:#eff6ff;border-left:4px solid #2563eb;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
                        <p style="margin:0;font-size:13px;color:#1e3a5f;line-height:1.7;">
                          <strong>ℹ️ Bilgi:</strong> Yukarıda gösterilen bakiye, firmamız kayıtlarındaki en güncel veridir. 
                          Hareket detayları, faturalar ve ödeme planınız için bayi portalına giriş yapabilirsiniz. 
                          Sorularınız için muhasebe departmanımızla iletişime geçebilirsiniz.
                        </p>
                      </div>

                      <!-- PORTAL BUTONU -->
                      <div style="text-align:center;margin:32px 0;">
                        <a href="https://atakaricilik.com/login" style="background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;display:inline-block;letter-spacing:0.03em;box-shadow:0 4px 12px rgba(29,78,216,0.35);">
                          📋 Hesap Hareketlerimi Görüntüle
                        </a>
                        <p style="margin:12px 0 0 0;font-size:12px;color:#94a3b8;">Bayi portalından tüm faturalarınıza, ödemelerinize ve ekstre raporlarınıza ulaşabilirsiniz.</p>
                      </div>

                      <!-- ALT BİLGİ -->
                      <hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0;" />
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size:12px;color:#64748b;">
                            <strong style="color:#1e293b;">Atak Arıcılık</strong><br/>
                            Muhasebe & Finans Departmanı<br/>
                            📧 muhasebe@atakaricilik.com
                          </td>
                          <td align="right" style="font-size:11px;color:#94a3b8;vertical-align:top;">
                            Bu e-posta otomatik<br/>olarak oluşturulmuştur.<br/>
                            © ${new Date().getFullYear()} Atak Arıcılık
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- ALT ŞERİT -->
                  <tr>
                    <td style="background-color:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">
                        Bu ekstre bildirimi <strong>{{tarih}}</strong> tarihinde Atak Arıcılık ERP sistemi tarafından otomatik oluşturulmuştur.
                      </p>
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
        subject: "🚨 Yeni Sipariş Alındı! - Sipariş No: {{siparis_no}}",
        variables: "kullanici_adi,siparis_no,siparis_tutari,odeme_yontemi,detay_linki,tarih,siparis_icerik",
        bodyHtml: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; tracking-wide">ATAK ARICILIK</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Yönetici Bildirim Servisi</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">🚨 Yeni Sipariş Alındı!</h3>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 24px;">Merhaba Yönetici,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">{{tarih}} tarihinde yeni bir sipariş aldınız. Siparişe ait detaylar aşağıdadır:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 45%;">Müşteri / Cari:</td>
                  <td style="padding: 6px 0;">{{kullanici_adi}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Sipariş Numarası:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #ea580c;">{{siparis_no}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Sipariş İçeriği:</td>
                  <td style="padding: 6px 0; white-space: pre-line;">{{siparis_icerik}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Sipariş Tutarı:</td>
                  <td style="padding: 6px 0; font-weight: bold;">₺{{siparis_tutari}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Ödeme Yöntemi:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #475569;">{{odeme_yontemi}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Tarih:</td>
                  <td style="padding: 6px 0;">{{tarih}}</td>
                </tr>
              </table>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Siparişi detaylı incelemek, onaylamak veya yazdırmak için aşağıdaki bağlantıyı kullanarak yönetim paneline gidebilirsiniz:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{detay_linki}}" style="background-color: #ea580c; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">Sipariş Yönetimine Git</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Bu bildirim e-postası Atak Arıcılık B2B sistemi tarafından otomatik olarak üretilmiştir. © Atak Arıcılık.</p>
          </div>
        `
      }
    };

    const def = defaultTemplates[eventType.toLowerCase().trim()];
    if (!def) {
      throw new Error(`Default template not found for event: ${eventType}`);
    }

    // Use upsert so that code-level template changes are always applied to the DB
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

    // 1. Fetch template from database
    let template = await prisma.emailTemplate.findUnique({
      where: { eventType: cleanEventType },
    });

    // Always upsert from code-level template to ensure DB stays in sync
    try {
      template = await this.seedDefaultTemplate(cleanEventType);
    } catch (seedErr: any) {
      // If upsert fails, fall back to what's in DB
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

    // 2. Compile subject & body html with placeholders
    const compiledSubject = this.compileTemplate(template.subject, placeholders);
    const compiledBody = this.compileTemplate(template.bodyHtml, placeholders);

    // 3. Create a PENDING log/queue record
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

    // 4. Trigger processing and await it to ensure transmission in serverless/PM2 environments
    await this.processQueue();

    return log.id;
  }

  /**
   * Queue Worker Loop: processes PENDING email logs from the database
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Find up to 5 pending logs ordered by creation date
      const pendingLogs = await prisma.emailLog.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 5,
      });

      for (const log of pendingLogs) {
        // Optimistic locking: update status to PROCESSING
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { status: "PROCESSING" },
        });

        try {
          await this.sendMail(log);

          // Update status to SUCCESS on successful transmission
          await prisma.emailLog.update({
            where: { id: log.id },
            data: { status: "SUCCESS" },
          });
          console.log(`[EmailNotificationService] Sent success to ${log.recipient}`);
        } catch (err: any) {
          console.error(`[EmailNotificationService] Failed to send to ${log.recipient}:`, err);
          const nextRetry = log.retryCount + 1;
          const maxRetries = Number(process.env.SMTP_MAX_RETRIES) || 3;

          if (nextRetry >= maxRetries) {
            // Move to FAILED status
            await prisma.emailLog.update({
              where: { id: log.id },
              data: {
                status: "FAILED",
                errorMessage: err.message || String(err),
                retryCount: nextRetry,
              },
            });
          } else {
            // Re-queue to PENDING for retry and wait
            await prisma.emailLog.update({
              where: { id: log.id },
              data: {
                status: "PENDING",
                errorMessage: err.message || String(err),
                retryCount: nextRetry,
              },
            });

            // Linear wait delay based on retry attempt
            const delaySec = nextRetry * (Number(process.env.SMTP_RETRY_DELAY) || 5);
            await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
          }
        }
      }
    } catch (err) {
      console.error("[EmailNotificationService] Worker error:", err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Sends compiled raw mail using Nodemailer transport pool
   */
  private async sendMail(log: any): Promise<void> {
    const fromName = process.env.SMTP_FROM_NAME || "Atak Arıcılık B2B";
    const fromUser = process.env.SMTP_USER || "";
    const domain = fromUser.split("@")[1] || "atakaricilik.com";
    const transporter = this.getTransporter();

    // Enforce RFC headers to prevent spam-filters
    await transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to: log.recipient,
      subject: log.subject,
      html: log.bodyHtml,
      headers: {
        "Message-ID": `<${uuidv4()}@${domain}>`,
        "X-Mailer": "Atak-ERP-Mailer/1.0.0",
        "Date": new Date().toUTCString(),
      },
    });
  }

  /**
   * Dynamic placeholder replacement using regex
   */
  private compileTemplate(text: string, placeholders: Record<string, any>): string {
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return placeholders[key] !== undefined ? String(placeholders[key]) : match;
    });
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService();
