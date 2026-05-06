export const runtime = 'nodejs';

export function GET() {
  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'MISSING',
    },
  });
}
