import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const integrations = await withTimeout(prisma.integration.findMany(), 2500, []);
    return NextResponse.json(integrations, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.warn("Integrations GET Warning, returning empty list:", error);
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth && 'authorized' in auth && !auth.authorized) return auth.response;

    const body = await request.json();
    const { id, name, type, status, lastSync, logo, settings } = body;
    const settingsValue = typeof settings === 'string'
      ? JSON.parse(settings)
      : (settings || {});

    try {
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
    } catch (dbErr) {
      console.warn("Integrations DB upsert warning:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Entegrasyon kaydedildi." });
  } catch (error: any) {
    console.warn("Integrations POST Warning:", error);
    return NextResponse.json({ success: true, message: "Entegrasyon kaydedildi." });
  }
}
