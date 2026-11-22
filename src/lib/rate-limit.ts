import { NextResponse } from 'next/server';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): { success: boolean; remaining: number } {
  const now = Date.now();
  
  if (!store[ip]) {
    store[ip] = { count: 1, resetTime: now + windowMs };
    return { success: true, remaining: limit - 1 };
  }

  if (now > store[ip].resetTime) {
    store[ip] = { count: 1, resetTime: now + windowMs };
    return { success: true, remaining: limit - 1 };
  }

  store[ip].count += 1;

  if (store[ip].count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - store[ip].count };
}

export async function withRateLimit(
  request: Request,
  limitType: string = 'global',
  limit: number = 60,
  windowMs: number = 60000
): Promise<NextResponse | null> {
  const rawIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    '127.0.0.1';
  const ip = rawIp.trim() || '127.0.0.1';
  const bucketKey = `${limitType || 'global'}:${ip}`;
  const rateCheck = checkRateLimit(bucketKey, limit, windowMs);

  if (!rateCheck.success) {
    return NextResponse.json({
      error: "Aşırı istek gönderildi. Lütfen bir süre sonra tekrar deneyiniz."
    }, { status: 429 });
  }

  return null;
}

export function maskPII(str: string | undefined | null): string {
  if (!str) return '***';
  if (str.includes('@')) {
    const [name, domain] = str.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  if (str.length >= 7) {
    return `${str.slice(0, 4)}***${str.slice(-2)}`;
  }
  return `${str.slice(0, 1)}***`;
}
