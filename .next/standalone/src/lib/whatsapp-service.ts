import { prisma } from "./prisma";
import { getLiveEnv } from "./env-helper";

interface WhatsAppPayload {
  to: string;        // Alıcı telefon numarası (ör: +905XXXXXXXXX)
  message: string;   // Gönderilecek mesaj metni
}

export class WhatsAppNotificationService {
  /**
   * Twilio API entegrasyonu ile WhatsApp mesajı gönderir.
   */
  private static async sendViaTwilio(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    const accountSid = getLiveEnv("TWILIO_ACCOUNT_SID");
    const authToken  = getLiveEnv("TWILIO_AUTH_TOKEN");
    const from       = getLiveEnv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886");

    if (!accountSid || !authToken) {
      return { success: false, error: "Twilio kimlik bilgileri eksik." };
    }

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: from,
          To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
          Body: message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || "Twilio API hatası." };
      }
      return { success: true, sid: data.sid };
    } catch (err: any) {
      return { success: false, error: err.message || "Twilio bağlantı hatası." };
    }
  }

  /**
   * Meta Cloud API entegrasyonu ile WhatsApp mesajı gönderir.
   */
  private static async sendViaMeta(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token       = getLiveEnv("META_WHATSAPP_TOKEN");
    const phoneNumId  = getLiveEnv("META_PHONE_NUMBER_ID");

    if (!token || !phoneNumId) {
      return { success: false, error: "Meta Cloud API kimlik bilgileri eksik." };
    }

    // Numarayı temizleyelim (sadece rakamlar ve başında artı olmadan)
    const cleanTo = to.replace(/[^0-9]/g, "");

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanTo,
          type: "text",
          text: { body: message },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error?.message || "Meta Cloud API hatası." };
      }
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (err: any) {
      return { success: false, error: err.message || "Meta Cloud API bağlantı hatası." };
    }
  }

  /**
   * WhatsApp wa.me deep-link oluşturur.
   */
  public static buildWaLink(to: string, message: string): string {
    const phone = to.replace(/[^0-9]/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Belirtilen numaraya genel WhatsApp mesajı gönderir (Sağlayıcı ayarlarına göre).
   */
  public static async sendWhatsApp(to: string, message: string): Promise<{ success: boolean; provider: string; link?: string; sid?: string; messageId?: string; error?: string }> {
    const provider = getLiveEnv("WHATSAPP_PROVIDER", "wame");

    if (!to) {
      return { success: false, provider, error: "Telefon numarası belirtilmemiş." };
    }

    if (provider === "twilio") {
      const result = await this.sendViaTwilio(to, message);
      return { ...result, provider };
    } else if (provider === "meta") {
      const result = await this.sendViaMeta(to, message);
      return { ...result, provider };
    } else {
      const link = this.buildWaLink(to, message);
      return {
        success: true,
        provider: "wame",
        link,
        error: "Gerçek gönderim için Twilio veya Meta Cloud API entegrasyonu seçilmelidir. deep-link üretildi."
      };
    }
  }

  /**
   * Yeni sipariş alındığında yöneticiye WhatsApp bildirimi gönderir.
   */
  public static async sendAdminNewOrderNotification(order: {
    siparisNo: string;
    kullaniciAdi: string;
    siparisTutari: number;
    odemeYontemi: string;
    orderId: string;
    siparisIcerik: string;
    adminPhone?: string;
    hostUrl?: string;
  }): Promise<any> {
    const rawPhone = order.adminPhone || getLiveEnv("ADMIN_NOTIFICATION_WHATSAPP");
    if (!rawPhone) {
      console.log("[WhatsAppService] ADMIN_NOTIFICATION_WHATSAPP ayarlanmadığı ve panelde girilmediği için yönetici sipariş bildirimi gönderilmedi.");
      return { success: false, error: "Yönetici telefon numarası girilmemiş." };
    }

    // Telefon numarasını temizle ve formatla (boşlukları sil, gerekirse +90 ekle)
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, "");
    const adminPhone = cleanPhone.startsWith("+") ? cleanPhone : (cleanPhone.startsWith("0") ? `+90${cleanPhone.substring(1)}` : `+90${cleanPhone}`);

    const host = order.hostUrl || getLiveEnv("NEXTAUTH_URL", "https://b2b.pekefe.com");
    const detayLink = `${host}/admin/orders/${order.orderId}`;
    const formattedAmount = order.siparisTutari.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const localDateStr = new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const message = [
      `🚨 *YENİ SİPARİŞ BİLDİRİMİ* 🚨`,
      `────────────────────────`,
      `👤 *Müşteri / Cari:* ${order.kullaniciAdi}`,
      `📋 *Sipariş No:* #${order.siparisNo}`,
      `📦 *Sipariş İçeriği:*`,
      `${order.siparisIcerik}`,
      `💰 *Tutar:* ₺${formattedAmount}`,
      `💳 *Ödeme Yöntemi:* ${order.odemeYontemi}`,
      `📅 *Tarih:* ${localDateStr}`,
      `────────────────────────`,
      `🔗 *Sipariş Detayı:* ${detayLink}`,
      `\n_PEKEFE Geleneksel & Doğal Lezzetler B2B Otomatik Bildirim Sistemi_`
    ].join("\n");

    console.log(`[WhatsAppService] Yönetici sipariş bildirimi gönderiliyor. Alıcı: ${adminPhone}`);
    const res = await this.sendWhatsApp(adminPhone, message);
    if (!res.success) {
      console.error(`[WhatsAppService] WhatsApp notification failed! Provider: ${res.provider}, Error: ${res.error}`);
    } else {
      console.log(`[WhatsAppService] WhatsApp notification successfully dispatched. Provider: ${res.provider}`);
    }
    return res;
  }
}
