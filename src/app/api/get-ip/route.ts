import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  const clientIp = (cfIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '')).replace('::ffff:', '');
  
  return NextResponse.json({ ip: clientIp });
}
