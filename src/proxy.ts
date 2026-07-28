import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routing } from './navigation';

const AUTH_ROUTES = ['/dashboard', '/orders', '/account', '/hesap', '/cart', '/checkout', '/sepet/odeme'];
const ADMIN_ROUTES = ['/admin', '/management'];
const PENDING_ROUTE = '/pending-approval';
const PUBLIC_ONLY_ROUTES = ['/giris', '/kayit', '/login-customer', '/register-customer'];

function matchesAny(pathname: string, routes: string[]): boolean {
  const cleanPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
  return routes.some((route) => cleanPath === route || cleanPath.startsWith(route + '/'));
}

const intlMiddleware = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = matchesAny(pathname, AUTH_ROUTES) || matchesAny(pathname, ADMIN_ROUTES);

  if (isProtected) {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/giris';
      return NextResponse.redirect(url);
    }

    if (token.role === 'DEALER' && !token.isApproved && !matchesAny(pathname, [PENDING_ROUTE])) {
      const url = req.nextUrl.clone();
      url.pathname = PENDING_ROUTE;
      return NextResponse.redirect(url);
    }

    const ERP_ROLES = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_SUPERVISOR', 'SALES_STAFF'];
    if (matchesAny(pathname, ADMIN_ROUTES) && !ERP_ROLES.includes(token.role as string)) {
      const url = req.nextUrl.clone();
      url.pathname = '/403';
      return NextResponse.redirect(url);
    }
  }

  if (matchesAny(pathname, PUBLIC_ONLY_ROUTES)) {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    if (token) {
      const url = req.nextUrl.clone();
      if (token.role === 'ADMIN') {
        url.pathname = '/admin/dashboard';
      } else if (token.role === 'DEALER') {
        url.pathname = '/b2b';
      } else {
        url.pathname = '/hesap';
      }
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/en') || pathname.startsWith('/tr')) {
    return intlMiddleware(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)',],
};
