import { auth } from '@clerk/nextjs/server';
import { getDb } from '@stpetemusic/db';
import { sql } from 'drizzle-orm';

export async function POST(_request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = getDb();
  const results: string[] = [];

  const migrations = [
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS facebook_page_id VARCHAR(100)`,
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS instagram_page_id VARCHAR(100)`,
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(255)`,
    `ALTER TABLE venues ADD COLUMN IF NOT EXISTS events_sources JSONB NOT NULL DEFAULT '[]'::jsonb`,
  ];

  for (const migration of migrations) {
    try {
      await db.execute(sql.raw(migration));
      results.push(`OK: ${migration}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`ERR: ${migration} → ${msg}`);
    }
  }

  return Response.json({ results });
}
