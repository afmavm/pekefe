import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { emailNotificationService } from '@/lib/email-notification-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, email, password, phone, taxId, city, district, address } = body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.role === "DEALER_REJECTED") {
        // Clear the old rejected record so the dealer can apply again
        await prisma.$transaction(async (tx) => {
          await tx.address.deleteMany({ where: { userId: existingUser.id } });
          await tx.currentAccount.deleteMany({ where: { email } });
          await tx.user.delete({ where: { id: existingUser.id } });
        });
      } else {
        return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanımda.' }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Create User and Dealer Account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "DEALER",
          isApproved: false
        }
      });

      // Create Current Account in ERP
      const account = await tx.currentAccount.create({
        data: {
          name: company,
          type: "MUSTERI",
          cariTipi: "CORPORATE",
          yetkiliKisi: name,
          taxId,
          phone,
          email,
          address: district ? `${address} - ${district} / ${city}` : `${address} / ${city}`,
          balance: 0,
          dealerGroup: "Standart",
          priceGroup: "Liste"
        }
      });

      // Split name into first and last name for Address table
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(" ") || "—";

      // Create default Address record for shipping/billing
      await tx.address.create({
        data: {
          userId: user.id,
          addressTitle: "Firma Fatura Adresi",
          firstName,
          lastName,
          phone,
          city: city || "Belirtilmedi",
          district: district || "Merkez",
          fullAddress: address || "Belirtilmedi",
          isDefault: true
        }
      });

      return { user, account };
    });

    // Create admin notification for the new dealer application
    try {
      await prisma.adminNotification.create({
        data: {
          title: `Yeni Bayi Başvurusu: ${company}`,
          message: `${name} (${email}) tarafından kayıt formu ile bayi başvurusu yapıldı.`,
          type: "APPLICATION",
          isRead: false
        }
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification for dealer application:", notifErr);
    }

    // Bayi başvuru mailini kuyruğa al
    try {
      await emailNotificationService.queueEmail(email, "dealer_applied", {
        kullanici_adi: name
      });
    } catch (mailErr) {
      console.error("Failed to queue dealer application email:", mailErr);
    }

    return NextResponse.json({ success: true, userId: result.user.id });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Kayıt sırasında bir hata oluştu.' }, { status: 500 });
  }
}
