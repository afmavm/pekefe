import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const integrations = await prisma.integration.findMany();
    return NextResponse.json(integrations);
  } catch (error: any) {
    console.error("Integrations GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { id, name, type, status, lastSync, logo, settings } = body;
    const settingsValue = typeof settings === 'string'
      ? JSON.parse(settings)
      : (settings || {});

    if (id) {
      await prisma.integration.upsert({
        where: { id },
        update: { name, type, status, lastSync: lastSync || null, logo, settings: settingsValue },
        create: { id, name, type, status, lastSync: lastSync || null, logo, settings: settingsValue },
      });
    } else {
      await prisma.integration.create({
        data: { name, type, status, lastSync: lastSync || null, logo, settings: settingsValue },
      });
    }

    return NextResponse.json({ success: true, message: "Entegrasyon kaydedildi." });
  } catch (error: any) {
    console.error("Integrations POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
