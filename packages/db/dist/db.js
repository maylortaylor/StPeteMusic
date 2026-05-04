import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
// ─────────────────────────────────────────────────────────────────────────────
// NEVER SELECT these encrypted BYTEA columns in any query:
//   artists.venmo, artists.zelle, artists.other_payment
//   persons.email, persons.phone
// Always exclude from SELECT clauses and admin forms
// ─────────────────────────────────────────────────────────────────────────────
let poolInstance = null;
let dbInstance = null;
function getPool() {
    if (!poolInstance) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        poolInstance = new Pool({
            connectionString,
            ssl: !/localhost|127\.0\.0\.1/.test(connectionString)
                ? { rejectUnauthorized: false }
                : false,
            max: 5,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });
    }
    return poolInstance;
}
export function getDb() {
    if (!dbInstance) {
        const pool = getPool();
        dbInstance = drizzle(pool, { schema });
    }
    return dbInstance;
}
export { schema };
