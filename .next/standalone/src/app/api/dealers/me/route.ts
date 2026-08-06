import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const account = await prisma.currentAccount.findFirst({
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

    if (!account) {
      return NextResponse.json({ error: 'Bayi cari kartı bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
