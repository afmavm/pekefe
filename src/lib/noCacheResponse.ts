import { NextResponse } from 'next/server';

export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
};

export function jsonNoCache(data: any, init?: ResponseInit) {
  const headers = {
    ...NO_CACHE_HEADERS,
    ...(init?.headers || {})
  };
  return NextResponse.json(data, {
    ...init,
    headers
  });
}
