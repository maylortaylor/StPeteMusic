import { Pool } from 'pg';
import { MIGRATIONS } from './migrations.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: !/localhost|127\.0\.0\.1/.test(connectionString) ? { rejectUnauthorized: false } : false,
  max: 3,
  connectionTimeoutMillis: 10_000,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    const { rows } = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations ORDER BY applied_at',
    );
    const applied = new Set(rows.map((r) => r.filename));

    let ran = 0;
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.filename)) {
        console.log(`  skip  ${migration.filename}`);
        continue;
      }
      console.log(`  apply ${migration.filename}`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [migration.filename],
        );
        await client.query('COMMIT');
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log(`Migrations complete: ${ran} applied, ${applied.size} already up to date.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
