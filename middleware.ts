import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto');
  const host = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  if (proto && proto !== 'https') {
    url.protocol = 'https';
    return NextResponse.redirect(url, { status: 308 });
  }

  if (host === 'www.mylinked.app') {
    url.hostname = 'mylinked.app';
    url.protocol = 'https';
    return NextResponse.redirect(url, { status: 308 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
