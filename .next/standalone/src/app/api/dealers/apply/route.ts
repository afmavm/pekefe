import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { emailNotificationService } from '@/lib/email-notification-service';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const body = await request.json();
    const { company, taxId, phone, city, district, address, notes } = body;

    if (!company || !phone) {
      return NextResponse.json({ error: 'Firma adı ve telefon zorunludur.' }, { status: 400 });
    }

    const email = session.user.email;
    const name = session.user.name || email.split("@")[0];

    // User rolünü DEALER ve isApproved = false olarak güncelle
    const user = await prisma.user.update({
      where: { email },
      data: {
        role: "DEALER",
        isApproved: false,
      },
    });

    // Cari hesabı kurumsal bayi cari hesabına dönüştür veya güncelle
    const existingCari = await prisma.currentAccount.findUnique({ where: { email } });

    if (existingCari) {
      await prisma.currentAccount.update({
        where: { email },
        data: {
          name: company,
          cariTipi: "CORPORATE",
          taxId: taxId || existingCari.taxId,
          phone: phone || existingCari.phone,
          address: city ? `${address || ""} ${district || ""} / ${city}` : existingCari.address,
        },
      });
    } else {
      await prisma.currentAccount.create({
        data: {
          name: company,
          type: "MUSTERI",
          cariTipi: "CORPORATE",
          yetkiliKisi: name,
          taxId: taxId || null,
          phone: phone || null,
          email,
          address: city ? `${address || ""} ${district || ""} / ${city}` : null,
          balance: 0,
          dealerGroup: "Standart",
          priceGroup: "Liste",
        },
      });
    }

    // Yöneticiye bildirim ekle
    try {
      await prisma.adminNotification.create({
        data: {
          title: `Yeni B2B Bayilik Başvurusu: ${company}`,
          message: `${name} (${email}) mevcut müşteri hesabından B2B bayilik başvurusu yaptı.`,
          type: "APPLICATION",
          isRead: false,
        },
      });
    } catch {}

    // E-posta gönder
    try {
      await emailNotificationService.queueEmail(email, "dealer_applied", {
        kullanici_adi: name,
      });
    } catch {}

    return NextResponse.json({ success: true, message: "B2B Bayilik başvurunuz başarıyla alındı." });

  } catch (error: any) {
    console.error('B2B Apply Error:', error);
    return NextResponse.json({ error: 'Başvuru sırasında bir hata oluştu.' }, { status: 500 });
  }
}
