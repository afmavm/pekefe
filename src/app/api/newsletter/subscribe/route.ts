import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit, maskPII } from '@/lib/rate-limit';
import { emailNotificationService } from '@/lib/email-notification-service';

const subscribeSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
});

export async function POST(request: Request) {
  try {
    const rateLimitResult = await withRateLimit(request, 'newsletter', 5, 60000);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.issues[0].message
      }, { status: 400 });
    }

    const { email } = validation.data;
    const maskedEmail = maskPII(email);
    console.log(`[NEWSLETTER] New subscription request for: ${maskedEmail}`);

    try {
      await emailNotificationService.queueEmail(
        email,
        "newsletter_welcome",
        {
          email,
          brandName: "PEKEFE Gastronomi",
          siteUrl: "https://www.pekefe.com"
        }
      );
    } catch (mailError) {
      console.error("[NEWSLETTER] Mail queueing non-fatal error:", mailError);
    }

    return NextResponse.json({
      success: true,
      message: "Bülten aboneliğiniz başarıyla tamamlandı. Teşekkür ederiz!",
      email: maskedEmail
    });

  } catch (error) {
    console.error("[NEWSLETTER_ERROR]", error);
    return NextResponse.json({
      error: "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyiniz."
    }, { status: 500 });
  }
}
