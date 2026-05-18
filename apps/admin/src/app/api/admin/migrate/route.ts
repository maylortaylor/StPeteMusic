import { auth } from '@clerk/nextjs/server';
import { getDb, MIGRATIONS } from '@stpetemusic/db';
import { sql } from 'drizzle-orm';

export async function GET(_request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = getDb();

  try {
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const counts: Record<string, number> = {};
    for (const row of tables.rows as { table_name: string }[]) {
      try {
        const r = await db.execute(sql.raw(`SELECT count(*) as n FROM "${row.table_name}"`));
        counts[row.table_name] = Number((r.rows[0] as { n: string }).n);
      } catch {
        counts[row.table_name] = -1;
      }
    }

    let appliedMigrations: string[] = [];
    try {
      const migResult = await db.execute(sql`SELECT filename FROM schema_migrations ORDER BY applied_at`);
      appliedMigrations = (migResult.rows as { filename: string }[]).map(r => r.filename);
    } catch {
      // schema_migrations table doesn't exist yet
    }

    const pendingMigrations = MIGRATIONS
      .filter(m => !appliedMigrations.includes(m.filename))
      .map(m => m.filename);

    return Response.json({
      database: process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@'),
      tables: (tables.rows as { table_name: string }[]).map(r => ({
        name: r.table_name,
        rows: counts[r.table_name],
      })),
      migrations: {
        total: MIGRATIONS.length,
        applied: appliedMigrations,
        pending: pendingMigrations,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(_request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = getDb();
  const results: { migration: string; status: 'ok' | 'skipped' | 'error'; detail?: string }[] = [];

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT now()
      )
    `);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Failed to create schema_migrations: ${msg}` }, { status: 500 });
  }

  for (const migration of MIGRATIONS) {
    try {
      const existing = await db.execute(
        sql`SELECT 1 FROM schema_migrations WHERE filename = ${migration.filename}`,
      );
      if (existing.rows.length > 0) {
        results.push({ migration: migration.filename, status: 'skipped' });
        continue;
      }

      await db.execute(sql.raw(migration.sql));
      await db.execute(
        sql`INSERT INTO schema_migrations (filename) VALUES (${migration.filename}) ON CONFLICT DO NOTHING`,
      );
      results.push({ migration: migration.filename, status: 'ok' });
    } catch (err) {
      const pg = err as Record<string, unknown>;
      const detail = [pg.code, pg.message ?? String(err), pg.detail, pg.hint]
        .filter(Boolean)
        .join(' | ');
      results.push({ migration: migration.filename, status: 'error', detail });
      // stop on first error so we don't run migrations out of order
      return Response.json({ results, stopped_at: migration.filename }, { status: 500 });
    }
  }

  return Response.json({ results });
}
