import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/rate-limit";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export const POST = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, smtpSecure, recipient } = body;

      if (!smtpHost || !smtpPort || !smtpUser || !recipient) {
        return NextResponse.json(
          { error: "Eksik parametre. Sunucu, Port, Gönderen adresi ve Alıcı adresi zorunludur." },
          { status: 400 }
        );
      }

      const host = smtpHost;
      const port = Number(smtpPort);
      
      // If password is empty in the test request, use the one stored in environment variables
      const pass = smtpPass !== undefined && smtpPass !== "" ? smtpPass : process.env.SMTP_PASS;

      const fromName = smtpFromName || "Atak Arıcılık B2B Test";
      const isSecure = smtpSecure === undefined ? (port === 465) : smtpSecure;

      console.log(`[SMTP_TEST] Initiating connection test to ${host}:${port} (Secure: ${isSecure}) for user ${smtpUser}`);

      // Create a transporter with a connection timeout
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: pass || ""
        },
        connectionTimeout: 8000, // 8 seconds timeout
        greetingTimeout: 5000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: false // Allow self-signed or internal certificates in test mode
        }
      });

      // Step 1: Verify Connection
      try {
        await new Promise<void>((resolve, reject) => {
          transporter.verify((err, success) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (verifyError: any) {
        console.error("[SMTP_TEST] Verification failed:", verifyError);
        return NextResponse.json({
          success: false,
          stage: "VERIFY_CONNECTION",
          message: "SMTP sunucusuna bağlantı kurulamadı veya kimlik bilgileri reddedildi.",
          errorDetails: verifyError.message || String(verifyError),
          errorCode: verifyError.code || "CONNECTION_ERROR"
        });
      }

      // Step 2: Send Test Email
      try {
        const mailOptions = {
          from: `"${fromName}" <${smtpUser}>`,
          to: recipient,
          subject: "B2B SMTP Sunucu Bağlantı Testi",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">✅</span>
                <h2 style="color: #1e293b; margin-top: 10px; margin-bottom: 5px;">Bağlantı Başarılı!</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 0;">SMTP Ayarlarınız Doğrulandı</p>
              </div>
              
              <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #334155; font-size: 14px; margin-top: 0; margin-bottom: 10px; border-b: 1px solid #e2e8f0; padding-bottom: 5px;">Bağlantı Detayları</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold; width: 140px;">SMTP Sunucusu (Host):</td>
                    <td style="padding: 4px 0;">${host}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold;">Port / Güvenlik:</td>
                    <td style="padding: 4px 0;">${port} (${isSecure ? "SSL/TLS - Güvenli" : "STARTTLS / Şifresiz"})</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold;">Gönderen Adresi:</td>
                    <td style="padding: 4px 0;">${smtpUser}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold;">Gönderen Adı (From):</td>
                    <td style="padding: 4px 0;">${fromName}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                Bu e-posta, Atak Arıcılık B2B yönetim panelinden yaptığınız <strong>SMTP Bağlantı Testi</strong> sonucunda otomatik olarak gönderilmiştir. Bu e-postayı alıyorsanız, sisteminiz otomatik bildirimleri (yeni kayıt, şifre sıfırlama, sipariş onayı, kargo bilgilendirmesi) başarıyla e-posta olarak gönderebilir durumdadır.
              </p>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                Atak Arıcılık B2B Yönetici Otomasyonu
              </p>
            </div>
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("[SMTP_TEST] Test email sent successfully:", info.messageId);

        return NextResponse.json({
          success: true,
          message: "SMTP bağlantısı kuruldu ve test e-postası başarıyla gönderildi!",
          messageId: info.messageId
        });
      } catch (sendError: any) {
        console.error("[SMTP_TEST] Email sending failed:", sendError);
        return NextResponse.json({
          success: false,
          stage: "SEND_EMAIL",
          message: "SMTP sunucusuna bağlanıldı ancak test e-postası gönderilemedi.",
          errorDetails: sendError.message || String(sendError),
          errorCode: sendError.code || "SEND_ERROR"
        });
      }
    } catch (error: any) {
      console.error("[SMTP_TEST] General error:", error);
      return NextResponse.json({ error: error.message || "Bağlantı testi başarısız oldu." }, { status: 500 });
    }
  },
  { role: "ADMIN", requireApproved: true }
);
