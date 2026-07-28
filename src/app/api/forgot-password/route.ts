import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email-service';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-posta adresi gereklidir." }, { status: 400 });
    }

    // 1. Check if user exists (to retrieve name)
    const user = await prisma.user.findUnique({
      where: { email }
    });

    const name = user?.name || email.split('@')[0];
    const resetCode = Math.floor(100000 + Math.random() * 900000);
    const resetLink = `${req.nextUrl.origin}/reset-password?code=${resetCode}&email=${encodeURIComponent(email)}`;

    // 2. Send via Email Service using the "forgot_password" template
    await emailService.sendEmail({
      eventType: "forgot_password",
      recipient: email,
      variables: {
        kullanici_adi: name,
        sifirlama_linki: resetLink,
        sifirlama_kodu: String(resetCode)
      }
    });

    // Determine if developer/mock mode is active (using SMTP_USER check)
    const smtpUser = process.env.SMTP_USER;
    const isMock = !smtpUser || smtpUser === 'test@example.com';
    
    return NextResponse.json({ 
      success: true, 
      message: "Şifre sıfırlama yönergeleri e-posta adresinize gönderildi.",
      // In dev mode, we can output a message or mock response info
      previewUrl: isMock ? `https://ethereal.email` : null
    });
    
  } catch (error: any) {
    console.error("Forgot Password Trigger ERROR:", error);
    return NextResponse.json({ error: error.message || "Sistemsel bir hata oluştu veya sunucu ayarlarınız geçersiz." }, { status: 500 });
  }
}
