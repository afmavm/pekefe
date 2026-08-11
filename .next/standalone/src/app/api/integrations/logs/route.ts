import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const logs = await prisma.integrationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Integration Logs GET Error:', error);
    return NextResponse.json({ error: error.message || 'Loglar çekilemedi.' }, { status: 500 });
  }
}
