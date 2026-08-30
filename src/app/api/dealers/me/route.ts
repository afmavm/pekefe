import { NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { readLocalOrders } from '@/lib/jsonOrderDb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase();
    const userName = session.user.name || "Pekefe Bayisi";

    let account = null;
    try {
      const accountPromise = prisma.currentAccount.findFirst({
        where: { email: session.user.email },
        include: {
          orders: {
            orderBy: { date: 'desc' },
            take: 10
          },
          invoices: {
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      });
      account = await withTimeout(accountPromise, 2500, null);
    } catch (dbErr) {
      console.warn("[DEALERS ME WARNING] Remote DB error, fallback to local dealer account:", dbErr);
    }

    // Yerel siparişlerden ciro ve ekstre hesapla
    const localOrders = readLocalOrders();
    const userOrders = localOrders.filter(
      (o) => (o.email && o.email.toLowerCase() === userEmail) ||
             (o.client && o.client.toLowerCase() === userName.toLowerCase()) ||
             (o.customerName && o.customerName.toLowerCase() === userName.toLowerCase())
    );
    const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total || o.amount || 0), 0);

    if (!account) {
      return NextResponse.json({
        id: `CARI-${(session.user as any)?.id || "001"}`,
        name: userName,
        company: userName + " Ticaret",
        email: session.user.email,
        phone: (session.user as any)?.phone || "0544 149 48 51",
        taxNumber: "1234567890",
        taxOffice: "İspir Vergi Dairesi",
        balance: totalSpent,
        creditLimit: 150000,
        riskLimit: 200000,
        discountRate: 15,
        dealerGroup: "Gold",
        group: "Gold",
        status: "APPROVED",
        orders: userOrders
      });
    }

    return NextResponse.json({
      ...account,
      orders: account.orders && account.orders.length > 0 ? account.orders : userOrders
    });
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
