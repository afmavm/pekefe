import { NextRequest } from 'next/server';
import { POST as handler, GET as getHandler } from '@/app/api/webhooks/paytr/route';

export async function GET(request: NextRequest) {
  return getHandler();
}

export async function POST(request: NextRequest) {
  return handler(request);
}
