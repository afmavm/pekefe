import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit, maskPII } from '@/lib/rate-limit';

const tastingReservationSchema = z.object({
  locationId: z.string().min(1),
  date: z.string().min(1),
  timeSlot: z.string().min(1),
  guestCount: z.number().min(1).max(20),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
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
    const validatedData = tastingReservationSchema.parse(body);

    const reservationCode = `TST-${uuidv4().slice(0, 6).toUpperCase()}`;

    // Sanitized PII Logging for KVKK & GDPR Compliance
    console.log(`[TASTING_RESERVATION_CREATED] Code: ${reservationCode} | Location: ${validatedData.locationId} | Guest: ${maskPII(validatedData.fullName)} | Phone: ${maskPII(validatedData.phone)}`);

    return NextResponse.json({
      success: true,
      reservationCode,
      message: "Tadım salonu rezervasyonu oluşturuldu."
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: error.issues?.[0]?.message || "Girdi doğrulama hatası"
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: "Rezervasyon kaydı sırasında sistem hatası oluştu."
    }, { status: 500 });
  }
}
