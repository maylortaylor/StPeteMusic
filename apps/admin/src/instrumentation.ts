export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Dynamically import to avoid pulling db code into edge runtime
  const { getDb, MIGRATIONS, sql } = await import('@stpetemusic/db');

  const db = getDb();

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    const applied = await db.execute(sql`SELECT filename FROM schema_migrations`);
    const appliedSet = new Set((applied.rows as { filename: string }[]).map(r => r.filename));

    const pending = MIGRATIONS.filter(m => !appliedSet.has(m.filename));

    if (pending.length === 0) {
      console.log('[migrations] all up to date');
      return;
    }

    console.log(`[migrations] running ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      console.log(`[migrations] → ${migration.filename}`);
      await db.execute(sql.raw(migration.sql));
      await db.execute(
        sql`INSERT INTO schema_migrations (filename) VALUES (${migration.filename}) ON CONFLICT DO NOTHING`,
      );
      console.log(`[migrations] ✓ ${migration.filename}`);
    }

    console.log('[migrations] complete');
  } catch (err) {
    // Log but don't crash the app — a broken migration shouldn't take down the whole server
    console.error('[migrations] failed:', err);
  }
}
