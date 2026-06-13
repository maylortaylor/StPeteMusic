import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  if (host === 'stpetemusic.live') {
    const path = request.nextUrl.pathname + request.nextUrl.search;
    return NextResponse.redirect(`https://www.stpetemusic.live${path}`, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
