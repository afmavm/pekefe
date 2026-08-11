import { NextResponse } from "next/server";
import { WhatsAppNotificationService } from "@/lib/whatsapp-service";

interface WhatsAppPayload {
  to: string;        // Alıcı telefon numarası (ör: +905XXXXXXXXX)
  message: string;   // Gönderilecek mesaj metni
  type?: "order" | "invoice" | "reminder" | "custom";
  orderId?: string;
  accountName?: string;
  amount?: number;
}

function getFormattedAmount(val: any): string {
  if (val === null || val === undefined) return "";
  const num = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(num) ? "" : num.toFixed(2);
}

function buildOrderMessage(payload: WhatsAppPayload): string {
  const amtStr = getFormattedAmount(payload.amount);
  const lines = [
    `🛒 *Yeni Sipariş Bildirimi*`,
    `────────────────────────`,
    `👤 Müşteri : ${payload.accountName || "Bilinmiyor"}`,
    payload.orderId ? `📋 Sipariş  : #${payload.orderId}` : "",
    amtStr ? `💰 Tutar    : ${amtStr} TRY` : "",
    `📅 Tarih   : ${new Date().toLocaleDateString("tr-TR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}`,
    `────────────────────────`,
    `Siparişiniz alındı, en kısa sürede hazırlanacaktır.`,
    `_PEKEFE E-Ticaret_`,
  ].filter(Boolean);
  return lines.join("\n");
}

function buildInvoiceMessage(payload: WhatsAppPayload): string {
  const amtStr = getFormattedAmount(payload.amount);
  return [
    `🧾 *Fatura Bildirimi*`,
    `────────────────────────`,
    `👤 Sayın : ${payload.accountName || "Müşteri"}`,
    payload.orderId ? `📋 Sipariş : #${payload.orderId}` : "",
    amtStr ? `💰 Tutar   : ${amtStr} TRY` : "",
    `📅 Tarih  : ${new Date().toLocaleDateString("tr-TR")}`,
    `────────────────────────`,
    `Faturanız kesilmiş olup e-posta adresinize gönderilmiştir.`,
    `_PEKEFE E-Ticaret_`,
  ].filter(Boolean).join("\n");
}

function buildReminderMessage(payload: WhatsAppPayload): string {
  const amtStr = getFormattedAmount(payload.amount);
  return [
    `⚠️ *Bakiye Hatırlatma*`,
    `────────────────────────`,
    `👤 Sayın : ${payload.accountName || "Müşteri"}`,
    amtStr ? `💸 Bakiye  : ${amtStr} TRY` : "",
    `────────────────────────`,
    `Hesabınızda vadesi geçmiş bakiye bulunmaktadır.`,
    `Lütfen ödemenizi en kısa sürede yapınız.`,
    `_PEKEFE E-Ticaret Muhasebe_`,
  ].filter(Boolean).join("\n");
}

export async function POST(request: Request) {
  try {
    const body: WhatsAppPayload = await request.json();
    const { to, message, type, orderId, accountName, amount } = body;

    if (!to) {
      return NextResponse.json({ error: "Alıcı telefon numarası zorunludur." }, { status: 400 });
    }

    // Mesajı belirle
    let finalMessage = message;
    if (!finalMessage) {
      if (type === "order") {
        finalMessage = buildOrderMessage({ to, message: "", type, orderId, accountName, amount });
      } else if (type === "invoice") {
        finalMessage = buildInvoiceMessage({ to, message: "", type, orderId, accountName, amount });
      } else if (type === "reminder") {
        finalMessage = buildReminderMessage({ to, message: "", type, accountName, amount });
      } else {
        finalMessage = `PEKEFE E-Ticaret: Yeni bildiriminiz var.`;
      }
    }

    const result = await WhatsAppNotificationService.sendWhatsApp(to, finalMessage);

    if (!result.success) {
      return NextResponse.json({ error: result.error, provider: result.provider }, { status: 500 });
    }

    const { success: _, ...otherResult } = result;
    return NextResponse.json({
      success: true,
      message: finalMessage,
      ...otherResult
    });
  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    return NextResponse.json({ error: error.message || "Bildirim gönderilemedi." }, { status: 500 });
  }
}

