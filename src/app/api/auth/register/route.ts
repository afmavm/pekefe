import { NextRequest, NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { emailNotificationService } from "@/lib/email-notification-service";
import { findLocalUser, upsertLocalUser } from "@/lib/jsonUserDb";
import { readLocalAccounts, saveLocalAccount, updateLocalAccount } from "@/lib/jsonCurrentAccountsDb";

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

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    // E-posta daha önce kayıtlı mı? (Yerel ve Uzak DB kontrolü)
    const existingLocal = findLocalUser({ email: cleanEmail });
    if (existingLocal && existingLocal.passwordHash) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }

    const existingDb = await withTimeout(
      prisma.user.findUnique({ where: { email: cleanEmail } }),
      1500,
      null
    );
    if (existingDb && existingDb.password) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Yerel Kullanıcı Veritabanına Kaydet
    const savedLocalUser = upsertLocalUser({
      id: existingDb?.id || existingLocal?.id,
      name: cleanName,
      email: cleanEmail,
      phone: phone || "",
      role: "USER",
      passwordHash: hashedPassword,
      status: "active",
      customer_type: "b2c",
      isApproved: true
    });

    // 2. Uzak Prisma Veritabanına Kaydet
    let dbUserId = savedLocalUser.id;
    try {
      const dbUser = await withTimeout(
        prisma.user.upsert({
          where: { email: cleanEmail },
          update: {
            name: cleanName,
            password: hashedPassword,
            isApproved: true,
          },
          create: {
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            role: "USER",
            isApproved: true,
            customer_type: "b2c",
          },
        }),
        2500,
        null
      );
      if (dbUser?.id) dbUserId = dbUser.id;
    } catch (dbErr) {
      console.warn("[REGISTER DB SYNC WARN]:", dbErr);
    }

    // 3. Her B2C kullanıcı için cari hesap oluştur veya güncelle (Yerel ve Uzak DB)
    const localAccounts = readLocalAccounts();
    const existingLocalAcc = localAccounts.find(
      a => a.email && a.email.toLowerCase() === cleanEmail
    );

    const year = new Date().getFullYear();
    const generatedCariKod = `B2C-${year}-${String(localAccounts.length + 1).padStart(4, '0')}`;

    if (!existingLocalAcc) {
      saveLocalAccount({
        id: `CARI-${Date.now()}`,
        cariKod: generatedCariKod,
        name: cleanName,
        email: cleanEmail,
        phone: phone || null,
        cariTipi: "INDIVIDUAL",
        type: "MUSTERI",
        kaynakPlatform: "PEKEFE_B2C",
        balance: 0,
        openingBalance: 0,
        creditLimit: 0,
        isActive: true,
        entegrasyonHaritalama: {
          b2bUserId: dbUserId,
          b2bEmail: cleanEmail,
          b2bAdSoyad: cleanName,
          b2bPassword: password,
          b2bIsActive: "true",
          b2bCreatedAt: new Date().toISOString()
        }
      });
    } else {
      updateLocalAccount(existingLocalAcc.id, {
        phone: phone || existingLocalAcc.phone,
        entegrasyonHaritalama: {
          ...(existingLocalAcc.entegrasyonHaritalama as any || {}),
          b2bUserId: dbUserId,
          b2bEmail: cleanEmail,
          b2bAdSoyad: cleanName,
          b2bPassword: password,
          b2bIsActive: "true"
        }
      });
    }

    try {
      const existingAccount = await withTimeout(
        prisma.currentAccount.findUnique({ where: { email: cleanEmail } }),
        1500,
        null
      );
      if (!existingAccount) {
        await withTimeout(
          prisma.currentAccount.create({
            data: {
              cariKod: generatedCariKod,
              name: cleanName,
              email: cleanEmail,
              phone: phone || null,
              cariTipi: "INDIVIDUAL",
              type: "MUSTERI",
              kaynakPlatform: "PEKEFE_B2C",
              balance: 0,
              openingBalance: 0,
              creditLimit: 0,
            },
          }),
          1500,
          null
        );
      } else {
        await withTimeout(
          prisma.currentAccount.update({
            where: { email: cleanEmail },
            data: { phone: phone || existingAccount.phone },
          }),
          1500,
          null
        );
      }
    } catch {}

    // Hoş geldin e-postasını kuyruğa al
    try {
      await emailNotificationService.queueEmail(cleanEmail, "welcome", {
        kullanici_adi: cleanName
      });
    } catch (mailErr) {
      console.error("Failed to queue welcome email:", mailErr);
    }

    return NextResponse.json(
      { message: "Kayıt başarılı.", userId: dbUserId },
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
