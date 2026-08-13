import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized && process.env.NODE_ENV === "production") {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return auth.response;
      }
    }

    const applications = await prisma.user.findMany({
      where: {
        role: { in: ["DEALER", "DEALER_REVIEW", "DEALER_REJECTED"] }
      },
      orderBy: { id: 'desc' }
    }).catch(() => []);

    const formattedApps = await Promise.all(applications.map(async (user) => {
      const account = await prisma.currentAccount.findFirst({
        where: { email: user.email ?? undefined }
      }).catch(() => null);
      
      let status = "BEKLEMEDE";
      if (user.role === "DEALER_REJECTED") {
        status = "REDDEDILDI";
      } else if (user.role === "DEALER_REVIEW") {
        status = "INCELENIYOR";
      } else if (user.role === "DEALER" && user.isApproved) {
        status = "ONAYLANDI";
      }
      
      return {
        id: user.id,
        companyName: account?.name || user.company_name || "Bilinmeyen Firma",
        contactName: user.name || "İsimsiz",
        email: user.email || "",
        phone: account?.phone || "Belirtilmedi",
        city: account?.address || "Belirtilmedi",
        taxNumber: account?.taxId || user.tax_id || "Belirtilmedi",
        message: account?.taxOffice ? `Vergi Dairesi: ${account.taxOffice}` : "",
        status,
        createdAt: account?.createdAt ? account.createdAt.toISOString() : new Date().toISOString()
      };
    }));

    return NextResponse.json(formattedApps);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json([]);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id, action, dealerGroup, priceGroup, creditLimit, riskLimit, vadeGun } = await request.json();

    if (action === "Kabul" || action === "ONAYLANDI") {
      const user = await prisma.user.update({
        where: { id },
        data: { isApproved: true }
      });

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
      }

      return NextResponse.json({ success: true, message: `Bayi onaylandı.` });
    } else {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user?.email) {
        await prisma.currentAccount.deleteMany({ where: { email: user.email } });
      }
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Başvuru reddedildi." });
    }
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, tax, contact, email, notes, sector } = body;

    if (!email || !company || !contact) {
      return NextResponse.json({ error: "E-posta, Şirket ve Yetkili Adı zorunludur." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.role === "DEALER_REJECTED") {
        // Clear old rejected record
        await prisma.$transaction(async (tx) => {
          await tx.address.deleteMany({ where: { userId: existingUser.id } });
          await tx.currentAccount.deleteMany({ where: { email } });
          await tx.user.delete({ where: { id: existingUser.id } });
        });
      } else {
        return NextResponse.json({ error: "Bu e-posta adresiyle daha önce kayıt yapılmış." }, { status: 400 });
      }
    }

    // Create dealer user without password (can be set upon approval or activation link)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: contact,
          email,
          role: "DEALER",
          isApproved: false,
          company_name: company,
          tax_id: tax
        }
      });

      await tx.currentAccount.create({
        data: {
          name: company,
          type: "MUSTERI",
          cariTipi: "CORPORATE",
          yetkiliKisi: contact,
          taxId: tax,
          email,
          address: "Belirtilmedi",
          balance: 0,
          dealerGroup: "Standart",
          priceGroup: "Liste",
          taxOffice: notes ? `${notes} (Sektör: ${sector})` : `Sektör: ${sector}`
        }
      });

      return user;
    });

    // Create admin notification
    try {
      await prisma.adminNotification.create({
        data: {
          title: `Yeni Kurumsal Bayi Başvurusu: ${company}`,
          message: `${contact} (${email}) tarafından B2B portalından ön başvuru yapıldı. Not: ${notes || "Yok"}`,
          type: "APPLICATION",
          isRead: false
        }
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification for application:", notifErr);
    }

    return NextResponse.json({ success: true, userId: result.id });
  } catch (error) {
    console.error("B2B Application Submission Error:", error);
    return NextResponse.json({ error: "Başvuru sırasında bir hata oluştu." }, { status: 500 });
  }
}
