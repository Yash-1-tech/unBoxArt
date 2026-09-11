import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';

// Routes that require login
const PROTECTED = ['/dashboard', '/orders', '/wishlist', '/profile', '/checkout'];

// Routes only non-logged-in users should see
const AUTH_ONLY = ['/auth/signin', '/auth/signup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));
  const isAuthOnly = AUTH_ONLY.some((r) => pathname.startsWith(r));

  const session = await getIronSession<SessionData>(req.cookies as any, sessionOptions);
  const isLoggedIn = !!session.user;

  if (isProtected && !isLoggedIn) {
    const url = new URL('/auth/signin', req.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
    '/profile/:path*',
    '/checkout/:path*',
    '/auth/signin',
    '/auth/signup',
  ],
};
