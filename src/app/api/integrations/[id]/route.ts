import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { settings, status } = await request.json();
    const { id } = await params;
    const settingsValue = typeof settings === 'string' ? JSON.parse(settings) : (settings || {});

    await prisma.integration.update({
      where: { id },
      data: {
        settings: settingsValue,
        status,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Integration PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({ where: { id } });
    if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(integration);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
