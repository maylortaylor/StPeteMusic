import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@stpetemusic/db';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== 'string') {
    return new NextResponse(null, { status: 204 });
  }

  logError({
    app: 'web',
    message: body.message,
    stack: typeof body.stack === 'string' ? body.stack : undefined,
    path: typeof body.path === 'string' ? body.path : undefined,
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata as Record<string, unknown> : {},
  });

  return new NextResponse(null, { status: 204 });
}
