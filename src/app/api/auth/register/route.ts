import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { emailNotificationService } from "@/lib/email-notification-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Ad, e-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    // E-posta daha önce kayıtlı mı?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        isApproved: true,    // Standart müşteriler otomatik onaylı
        customer_type: "b2c", // B2C müşteri olarak işaretle
      },
    });

    // Her B2C kullanıcı için cari hesap oluştur (telefon olsun ya da olmasın)
    const existingAccount = await prisma.currentAccount.findUnique({ where: { email } });
    if (!existingAccount) {
      await prisma.currentAccount.create({
        data: {
          name,
          email,
          phone: phone || null,
          cariTipi: "INDIVIDUAL",  // B2C bireysel müşteri
          type: "MUSTERI",
          kaynakPlatform: "ATAK_B2C", // B2C web sitesi üzerinden kayıt
          balance: 0,
          creditLimit: 0,
        },
      });
    } else {
      // Varsa güncelle — cariTipi'ni koru, telefon varsa ekle
      await prisma.currentAccount.update({
        where: { email },
        data: { phone: phone || existingAccount.phone },
      });
    }


    // Hoş geldin e-postasını kuyruğa al
    try {
      await emailNotificationService.queueEmail(email, "welcome", {
        kullanici_adi: name
      });
    } catch (mailErr) {
      console.error("Failed to queue welcome email:", mailErr);
    }

    return NextResponse.json(
      { message: "Kayıt başarılı.", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
