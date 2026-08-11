import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const POST = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const {
        whatsappProvider,
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsappFrom,
        metaWhatsappToken,
        metaPhoneNumberId,
        recipient,
        message
      } = body;

      if (!whatsappProvider || !recipient) {
        return NextResponse.json(
          { error: "Eksik parametre. Sağlayıcı ve Alıcı numarası zorunludur." },
          { status: 400 }
        );
      }

      const activeProvider = whatsappProvider;
      const testMsg = message || "B2B WhatsApp Entegrasyon Test Mesajı";

      if (activeProvider === "twilio") {
        const sid = twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
        const token = twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
        const from = twilioWhatsappFrom || process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

        if (!sid || !token) {
          return NextResponse.json({
            success: false,
            stage: "CREDENTIALS",
            message: "Twilio SID veya Auth Token tanımlı değil."
          });
        }

        const credentials = Buffer.from(`${sid}:${token}`).toString("base64");
        const formattedTo = recipient.startsWith("whatsapp:") ? recipient : `whatsapp:${recipient}`;

        try {
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: from,
              To: formattedTo,
              Body: testMsg,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            return NextResponse.json({
              success: false,
              stage: "SEND_API",
              message: data.message || "Twilio API hatası.",
              errorDetails: JSON.stringify(data)
            });
          }

          return NextResponse.json({
            success: true,
            message: `Twilio üzerinden mesaj gönderildi. SID: ${data.sid}`,
            provider: "twilio"
          });
        } catch (err: any) {
          return NextResponse.json({
            success: false,
            stage: "NETWORK",
            message: "Twilio bağlantı hatası.",
            errorDetails: err.message || String(err)
          });
        }
      } else if (activeProvider === "meta") {
        const token = metaWhatsappToken || process.env.META_WHATSAPP_TOKEN;
        const phoneNumId = metaPhoneNumberId || process.env.META_PHONE_NUMBER_ID;

        if (!token || !phoneNumId) {
          return NextResponse.json({
            success: false,
            stage: "CREDENTIALS",
            message: "Meta Cloud Token veya Telefon Numarası ID tanımlı değil."
          });
        }

        const cleanTo = recipient.replace(/[^0-9]/g, "");

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
              text: { body: testMsg },
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            return NextResponse.json({
              success: false,
              stage: "SEND_API",
              message: data.error?.message || "Meta Cloud API hatası.",
              errorDetails: JSON.stringify(data)
            });
          }

          return NextResponse.json({
            success: true,
            message: `Meta Cloud üzerinden mesaj gönderildi. Mesaj ID: ${data.messages?.[0]?.id}`,
            provider: "meta"
          });
        } catch (err: any) {
          return NextResponse.json({
            success: false,
            stage: "NETWORK",
            message: "Meta Cloud API bağlantı hatası.",
            errorDetails: err.message || String(err)
          });
        }
      } else {
        // wame link generator
        const phone = recipient.replace(/[^0-9]/g, "");
        const link = `https://wa.me/${phone}?text=${encodeURIComponent(testMsg)}`;
        return NextResponse.json({
          success: true,
          message: "wame yönlendirme bağlantısı başarıyla oluşturuldu.",
          provider: "wame",
          link
        });
      }
    } catch (error: any) {
      console.error("[WHATSAPP_TEST] General error:", error);
      return NextResponse.json({ error: error.message || "Bağlantı testi başarısız oldu." }, { status: 500 });
    }
  },
  { role: "ADMIN", requireApproved: true }
);
