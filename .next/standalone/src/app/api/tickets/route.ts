import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { isAdminRole } from '@/lib/auth-helpers';

const TicketSchema = z.object({
  subject: z.string().min(5),
  category: z.string(),
  message: z.string().min(10),
  orderId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const body = await request.json();
    const result = TicketSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 });
    }

    const { subject, category, message, orderId } = result.data;

    const ticket = await prisma.ticket.create({
      data: {
        email,
        subject,
        category,
        orderId,
        status: "ACIK",
        messages: {
          create: {
            sender: "USER",
            message
          }
        }
      }
    });

    // Create admin notification
    try {
      await prisma.adminNotification.create({
        data: {
          title: `Yeni Destek Talebi: ${subject}`,
          message: `${email} tarafından yeni bir destek talebi oluşturuldu.`,
          type: "TICKET",
          isRead: false
        }
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification for ticket:", notifErr);
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    // To properly secure admin access, we should check role. 
    // Here we assume if they fetch GET /api/tickets from admin panel, we check email.
    // We'll let admin fetch all, user fetch own.
    let whereClause = {};
    if (!session?.user?.role || !isAdminRole(session.user.role)) {
      if (!email) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
      whereClause = { email };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const emails = tickets.map((t) => t.email).filter(Boolean);
    const accounts = emails.length > 0 ? await prisma.currentAccount.findMany({
      where: { email: { in: emails } },
      select: { email: true, name: true, type: true }
    }) : [];

    const accountMap = new Map(accounts.map((a) => [a.email, a]));

    const ticketsWithAccount = tickets.map((t) => ({
      ...t,
      currentAccount: t.email ? accountMap.get(t.email) || null : null
    }));

    return NextResponse.json(ticketsWithAccount);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
