import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { isAdminRole } from '@/lib/auth-helpers';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const { id } = await params;

    if (!email) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket bulunamadı." }, { status: 404 });
    }

    // Security check: Only the creator or admin can view
    const isUserAdmin = session?.user?.role && isAdminRole(session.user.role);
    if (ticket.email !== email && !isUserAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const account = ticket.email ? await prisma.currentAccount.findUnique({
      where: { email: ticket.email },
      select: { id: true, name: true, type: true, phone: true, balance: true, currency: true }
    }) : null;

    return NextResponse.json({
      ...ticket,
      currentAccount: account
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const isAdmin = !!(session?.user?.role && isAdminRole(session.user.role));
    const { id } = await params;

    if (!email) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const { message, newStatus } = await request.json();

    const ticket = await prisma.ticket.findUnique({ where: { id: id } });
    if (!ticket) return NextResponse.json({ error: "Ticket bulunamadı." }, { status: 404 });

    // Security
    if (ticket.email !== email && !isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    // Add new message
    if (message) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          sender: isAdmin ? "ADMIN" : "USER",
          message
        }
      });

      // If customer is replying, notify admin
      if (!isAdmin) {
        try {
          await prisma.adminNotification.create({
            data: {
              title: `Yeni Destek Talebi Yanıtı: ${ticket.subject}`,
              message: `${email} müşterisi destek talebine yanıt gönderdi.`,
              type: "TICKET",
              isRead: false
            }
          });
        } catch (notifErr) {
          console.error("Failed to create admin notification for ticket reply:", notifErr);
        }
      }
    }

    // Update status (e.g. USER replies -> "ACIK", ADMIN replies -> "CEVAPLANDI")
    let statusToSet = newStatus || ticket.status;
    if (!newStatus) {
      statusToSet = isAdmin ? "CEVAPLANDI" : "ACIK";
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: statusToSet },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
