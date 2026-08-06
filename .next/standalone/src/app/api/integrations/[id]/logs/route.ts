import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const logs = await prisma.integrationLog.findMany({
      where: { integrationId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Integration Logs GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
