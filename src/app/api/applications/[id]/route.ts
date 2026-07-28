import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { emailNotificationService } from '@/lib/email-notification-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  try {
    const { status, dealerGroup, priceGroup, creditLimit, riskLimit, vadeGun } = await request.json();

    if (status === "ONAYLANDI") {
      // 1. Approve User
      const user = await prisma.user.update({
        where: { id },
        data: { isApproved: true, role: "DEALER" }
      });

      // 2. Create or update CurrentAccount in ERP
      if (user.email) {
        const existingAccount = await prisma.currentAccount.findFirst({
          where: { email: user.email }
        });

        const parsedCreditLimit = creditLimit ? parseFloat(creditLimit) : 0;
        const parsedRiskLimit = riskLimit ? parseFloat(riskLimit) : parsedCreditLimit * 1.2;
        const parsedVadeGun = vadeGun ? parseInt(vadeGun) : 0;

        if (!existingAccount) {
          await prisma.currentAccount.create({
            data: {
              name: user.name || "Yeni Bayi",
              type: "MUSTERI",
              cariTipi: "CORPORATE",
              email: user.email,
              balance: 0,
              dealerGroup: dealerGroup || "Standart",
              priceGroup: priceGroup || "Liste",
              creditLimit: parsedCreditLimit,
              riskLimit: parsedRiskLimit,
              vadeGun: parsedVadeGun,
              isActive: true
            }
          });
        } else {
          await prisma.currentAccount.update({
            where: { id: existingAccount.id },
            data: {
              dealerGroup: dealerGroup || "Standart",
              priceGroup: priceGroup || "Liste",
              creditLimit: parsedCreditLimit,
              riskLimit: parsedRiskLimit,
              vadeGun: parsedVadeGun,
              isActive: true
            }
          });
        }
        // Bayi onay mailini kuyruğa al
        try {
          await emailNotificationService.queueEmail(user.email, "dealer_approved", {
            kullanici_adi: user.name || user.email,
            bayi_grubu: dealerGroup || "Standart",
            fiyat_grubu: priceGroup || "Liste",
            kredi_limiti: creditLimit ? parseFloat(creditLimit).toLocaleString("tr-TR") : "0"
          });
        } catch (mailErr) {
          console.error("Failed to queue dealer approved email:", mailErr);
        }
      }

      return NextResponse.json({ success: true, message: `"${user.name}" onaylandı ve bayi olarak aktifleştirildi.` });
    } else if (status === "REDDEDILDI") {
      const user = await prisma.user.update({
        where: { id },
        data: { role: "DEALER_REJECTED", isApproved: false }
      });
      if (user.email) {
        await prisma.currentAccount.updateMany({
          where: { email: user.email },
          data: { isActive: false }
        });

        // Bayi red mailini kuyruğa al
        try {
          await emailNotificationService.queueEmail(user.email, "dealer_rejected", {
            kullanici_adi: user.name || user.email
          });
        } catch (mailErr) {
          console.error("Failed to queue dealer rejected email:", mailErr);
        }
      }

      return NextResponse.json({ success: true, message: "Başvuru reddedildi." });
    } else if (status === "INCELENIYOR") {
      const user = await prisma.user.update({
        where: { id },
        data: { role: "DEALER_REVIEW", isApproved: false }
      });
      return NextResponse.json({ success: true, message: "Başvuru inceleme durumuna alındı." });
    } else if (status === "BEKLEMEDE") {
      const user = await prisma.user.update({
        where: { id },
        data: { role: "DEALER", isApproved: false }
      });
      return NextResponse.json({ success: true, message: "Başvuru bekleme durumuna alındı." });
    } else if (status === "DELETE") {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user?.email) {
        await prisma.currentAccount.deleteMany({ where: { email: user.email } });
      }
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Kayıt veritabanından tamamen silindi." });
    }

    return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
