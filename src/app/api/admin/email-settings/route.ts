import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/rate-limit";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const envFilePath = path.join(process.cwd(), ".env");

// Helper function to update variables in the .env file on disk
function updateEnvFile(updates: Record<string, string>) {
  let content = "";
  if (fs.existsSync(envFilePath)) {
    content = fs.readFileSync(envFilePath, "utf-8");
  }

  const lines = content.split("\n");
  const updatedLines = [...lines];

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`);
    const lineIndex = updatedLines.findIndex(line => regex.test(line.trim()));

    // Make sure the value is properly escaped or enclosed if it has special characters
    const newLine = `${key}="${value.replace(/"/g, '\\"')}"`;

    if (lineIndex !== -1) {
      updatedLines[lineIndex] = newLine;
    } else {
      updatedLines.push(newLine);
    }
  }

  fs.writeFileSync(envFilePath, updatedLines.join("\n"), "utf-8");
}

// GET current email and whatsapp settings (Admin Only)
export const GET = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const smtpPort = process.env.SMTP_PORT || "587";
      const smtpSecureVal = process.env.SMTP_SECURE;
      const smtpSecure = smtpSecureVal ? smtpSecureVal === "true" : (smtpPort === "465");
      
      return NextResponse.json({
        smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
        smtpPort,
        smtpUser: process.env.SMTP_USER || "",
        smtpPass: process.env.SMTP_PASS || "",
        smtpFromName: process.env.SMTP_FROM_NAME || "Atak Arıcılık B2B",
        smtpSecure,
        smtpMaxRetries: Number(process.env.SMTP_MAX_RETRIES) || 3,
        smtpRetryDelay: Number(process.env.SMTP_RETRY_DELAY) || 5,
        adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "",
        // WhatsApp settings
        whatsappProvider: process.env.WHATSAPP_PROVIDER || "wame",
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
        twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM || "",
        metaWhatsappToken: process.env.META_WHATSAPP_TOKEN || "",
        metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || "",
        adminNotificationWhatsapp: process.env.ADMIN_NOTIFICATION_WHATSAPP || ""
      });
    } catch (error) {
      console.error("Error reading integration settings:", error);
      return NextResponse.json({ error: "Ayarlar okunamadı." }, { status: 500 });
    }
  },
  { role: "ADMIN", requireApproved: true }
);

// POST update email and whatsapp settings (Admin Only)
export const POST = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { 
        smtpHost, 
        smtpPort, 
        smtpUser, 
        smtpPass, 
        smtpFromName, 
        smtpSecure,
        smtpMaxRetries,
        smtpRetryDelay,
        adminNotificationEmail,
        whatsappProvider,
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsappFrom,
        metaWhatsappToken,
        metaPhoneNumberId,
        adminNotificationWhatsapp
      } = body;

      if (!smtpHost || !smtpPort || !smtpUser) {
        return NextResponse.json({ error: "Eksik parametre girdiniz. E-posta Sunucu, Port ve Gönderici adresi zorunludur." }, { status: 400 });
      }

      const secureStr = smtpSecure ? "true" : "false";
      const maxRetriesStr = String(smtpMaxRetries !== undefined ? smtpMaxRetries : 3);
      const retryDelayStr = String(smtpRetryDelay !== undefined ? smtpRetryDelay : 5);
      const adminEmailStr = adminNotificationEmail || "";

      // Update in Node process environment
      process.env.SMTP_HOST = smtpHost;
      process.env.SMTP_PORT = smtpPort;
      process.env.SMTP_USER = smtpUser;
      if (smtpPass !== undefined) {
        process.env.SMTP_PASS = smtpPass;
      }
      process.env.SMTP_FROM_NAME = smtpFromName || "Atak Arıcılık B2B";
      process.env.SMTP_SECURE = secureStr;
      process.env.SMTP_MAX_RETRIES = maxRetriesStr;
      process.env.SMTP_RETRY_DELAY = retryDelayStr;
      process.env.ADMIN_NOTIFICATION_EMAIL = adminEmailStr;

      if (whatsappProvider !== undefined) process.env.WHATSAPP_PROVIDER = whatsappProvider;
      if (twilioAccountSid !== undefined) process.env.TWILIO_ACCOUNT_SID = twilioAccountSid;
      if (twilioAuthToken !== undefined) process.env.TWILIO_AUTH_TOKEN = twilioAuthToken;
      if (twilioWhatsappFrom !== undefined) process.env.TWILIO_WHATSAPP_FROM = twilioWhatsappFrom;
      if (metaWhatsappToken !== undefined) process.env.META_WHATSAPP_TOKEN = metaWhatsappToken;
      if (metaPhoneNumberId !== undefined) process.env.META_PHONE_NUMBER_ID = metaPhoneNumberId;
      if (adminNotificationWhatsapp !== undefined) process.env.ADMIN_NOTIFICATION_WHATSAPP = adminNotificationWhatsapp;

      // Write to physical .env file
      const updates: Record<string, string> = {
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        SMTP_USER: smtpUser,
        SMTP_FROM_NAME: smtpFromName || "Atak Arıcılık B2B",
        SMTP_SECURE: secureStr,
        SMTP_MAX_RETRIES: maxRetriesStr,
        SMTP_RETRY_DELAY: retryDelayStr,
        ADMIN_NOTIFICATION_EMAIL: adminEmailStr
      };

      if (smtpPass !== undefined) {
        updates.SMTP_PASS = smtpPass;
      }

      if (whatsappProvider !== undefined) updates.WHATSAPP_PROVIDER = whatsappProvider;
      if (twilioAccountSid !== undefined) updates.TWILIO_ACCOUNT_SID = twilioAccountSid;
      if (twilioAuthToken !== undefined) updates.TWILIO_AUTH_TOKEN = twilioAuthToken;
      if (twilioWhatsappFrom !== undefined) updates.TWILIO_WHATSAPP_FROM = twilioWhatsappFrom;
      if (metaWhatsappToken !== undefined) updates.META_WHATSAPP_TOKEN = metaWhatsappToken;
      if (metaPhoneNumberId !== undefined) updates.META_PHONE_NUMBER_ID = metaPhoneNumberId;
      if (adminNotificationWhatsapp !== undefined) updates.ADMIN_NOTIFICATION_WHATSAPP = adminNotificationWhatsapp;

      updateEnvFile(updates);

      return NextResponse.json({ success: true, message: "Entegrasyon Ayarları başarıyla güncellendi." });
    } catch (error) {
      console.error("Error writing settings:", error);
      return NextResponse.json({ error: "Ayarlar kaydedilerken bir hata oluştu." }, { status: 500 });
    }
  },
  { role: "ADMIN", requireApproved: true }
);
