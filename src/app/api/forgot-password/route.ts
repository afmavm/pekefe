import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { findLocalUser } from '@/lib/jsonUserDb';
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

    const cleanEmail = email.trim().toLowerCase();
    const localUser = findLocalUser({ email: cleanEmail });
    const dbUser = await withTimeout(
      prisma.user.findUnique({ where: { email: cleanEmail } }),
      1500,
      null
    );

    const name = localUser?.name || dbUser?.name || cleanEmail.split('@')[0];
    const resetCode = Math.floor(100000 + Math.random() * 900000);
    const resetLink = `${req.nextUrl.origin}/giris?email=${encodeURIComponent(cleanEmail)}`;

    try {
      await emailService.sendEmail({
        eventType: "forgot_password",
        recipient: cleanEmail,
        variables: {
          kullanici_adi: name,
          sifirlama_linki: resetLink,
          sifirlama_kodu: String(resetCode)
        }
      });
    } catch (mailErr) {
      console.warn("[FORGOT PASSWORD EMAIL WARN]:", mailErr);
    }

    const smtpUser = process.env.SMTP_USER;
    const isMock = !smtpUser || smtpUser === 'test@example.com';
    
    return NextResponse.json({ 
      success: true, 
      message: "Şifre sıfırlama yönergeleri e-posta adresinize gönderildi.",
      previewUrl: isMock ? `https://ethereal.email` : null
    });
    
  } catch (error: any) {
    console.error("Forgot Password Trigger ERROR:", error);
    return NextResponse.json({ error: error.message || "Sistemsel bir hata oluştu veya sunucu ayarlarınız geçersiz." }, { status: 500 });
  }
}
