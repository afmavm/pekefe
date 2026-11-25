import { NextResponse } from 'next/server';
import { getRetentionConfig, runRetentionCycle } from '@/lib/retention-service';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

async function handleCron(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-retention-key') || '';
  const config = await getRetentionConfig();

  const keyValid = Boolean(key && config.cronSecret && key === config.cronSecret);
  if (!keyValid) {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized cron key' }, { status: 401 });
    }
  }

  const result = await runRetentionCycle();
  return NextResponse.json({ success: true, ...result });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
