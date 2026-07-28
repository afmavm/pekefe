import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit, maskPII } from '@/lib/rate-limit';

const preOrderSchema = z.object({
  batchId: z.string().min(1),
  fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  quantity: z.number().min(1).max(50),
  notes: z.string().optional()
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
    const validatedData = preOrderSchema.parse(body);

    const reservationCode = `RKL-${new Date().getFullYear()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    // Sanitized PII Logging for KVKK & GDPR Compliance
    console.log(`[HARVEST_PRE_ORDER_RECEIVED] Reservation Code: ${reservationCode} | Batch: ${validatedData.batchId} | Customer: ${maskPII(validatedData.fullName)} | Email: ${maskPII(validatedData.email)}`);

    return NextResponse.json({
      success: true,
      reservationCode,
      message: "Ön sipariş rezervasyonunuz başarıyla kayıt altına alındı."
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: error.issues?.[0]?.message || error.message || "Girdi doğrulama hatası"
      }, { status: 400 });
    }

    console.error('[HARVEST_PRE_ORDER_ERROR]:', error);
    return NextResponse.json({
      success: false,
      message: "Rezervasyon kaydı sırasında sistem hatası oluştu."
    }, { status: 500 });
  }
}
