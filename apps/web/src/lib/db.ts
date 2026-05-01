import { Pool, type QueryResultRow } from 'pg';

// ─────────────────────────────────────────────────────────────────────────────
// NEVER SELECT these encrypted BYTEA columns in any query:
//   artists.venmo, artists.zelle, artists.other_payment
//   persons.email,  persons.phone
// ─────────────────────────────────────────────────────────────────────────────

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString,
      ssl: !/localhost|127\.0\.0\.1/.test(connectionString) ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
