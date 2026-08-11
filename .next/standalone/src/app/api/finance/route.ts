import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// Finans Verilerini Getir (Sadece Admin)
export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const [transactions, banks, invoices] = await Promise.all([
        prisma.transaction.findMany({ orderBy: { date: 'desc' } }),
        prisma.bank.findMany(),
        prisma.invoice.findMany({ orderBy: { date: 'desc' } })
      ]);
      
      return NextResponse.json({ 
        transactions: transactions.map(t => ({
          ...t,
          accountId: t.currentAccountId,
          date: t.date.toISOString().split('T')[0]
        })), 
        banks, 
        invoices: invoices.map(inv => ({ 
          ...inv, 
          accountId: inv.currentAccountId,
          date: inv.date.toISOString().split('T')[0],
          dueDate: inv.dueDate.toISOString().split('T')[0],
          items: inv.items as any
        })) 
      }, { headers: NO_CACHE_HEADERS });
    } catch (error) {
      console.error('Error fetching finance data:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Yeni İşlem Kaydı Oluştur (Sadece Admin)
export const POST = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { type, accountId, amount, description, paymentMethod } = body;

      const result = await prisma.$transaction(async (tx) => {
        let balanceChange = 0;
        if (["Satış Faturası", "Ödeme", "Açılış Bakiyesi"].includes(type)) {
          balanceChange = Math.abs(Number(amount));
        } else if (["Alış Faturası", "Tahsilat", "İade"].includes(type)) {
          balanceChange = -Math.abs(Number(amount));
        }

        const transaction = await tx.transaction.create({
          data: {
            currentAccountId: accountId,
            type,
            amount: balanceChange,
            description,
            paymentMethod
          }
        });

        await tx.currentAccount.update({
          where: { id: accountId },
          data: { balance: { increment: balanceChange } }
        });

        return transaction;
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
