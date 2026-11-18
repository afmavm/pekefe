import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const invoices = await withTimeout(
      prisma.invoice.findMany({
        where: orderId ? { orderId, isDeleted: false } : { isDeleted: false },
        include: {
          currentAccount: true,
        },
        orderBy: { date: 'desc' },
      }),
      2500,
      [] as any[]
    );

    return NextResponse.json(invoices, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    console.warn('[API INVOICES WARNING] DB erişimi yok:', error);
    return NextResponse.json([], { status: 200 });
  }
}
