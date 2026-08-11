import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit, maskPII } from '@/lib/rate-limit';

const enrollmentSchema = z.object({
  courseId: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  occupation: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, 10, 60000);
    if (!rateCheck.success) {
      return NextResponse.json({
        success: false,
        message: "Çok fazla istek gönderdiniz. Lütfen 1 dakika sonra tekrar deneyin."
      }, { status: 429 });
    }

    const body = await request.json();
    const validatedData = enrollmentSchema.parse(body);

    const enrollmentId = `ACAD-${uuidv4().slice(0, 6).toUpperCase()}`;

    // Sanitized PII Logging for KVKK & GDPR Compliance
    console.log(`[ACADEMY_ENROLLMENT] Enrollment ID: ${enrollmentId} | Course: ${validatedData.courseId} | Customer: ${maskPII(validatedData.fullName)} | Email: ${maskPII(validatedData.email)}`);

    return NextResponse.json({
      success: true,
      enrollmentId,
      message: "Akademi kayıt başvurunuz alındı."
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: error.issues?.[0]?.message || "Doğrulama hatası"
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: "Kayıt işlemi sırasında hata oluştu."
    }, { status: 500 });
  }
}
