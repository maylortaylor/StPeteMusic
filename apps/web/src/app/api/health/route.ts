export const runtime = 'nodejs';

export function GET() {
  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL:         process.env.DATABASE_URL         ? 'SET' : 'MISSING',
      RESEND_API_KEY:       process.env.RESEND_API_KEY       ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING',
      NODE_ENV:             process.env.NODE_ENV             || 'MISSING',
    },
  });
}
