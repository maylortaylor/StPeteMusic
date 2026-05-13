import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(`
    ALTER TABLE venues ADD COLUMN IF NOT EXISTS facebook_page_id VARCHAR(100);
    ALTER TABLE venues ADD COLUMN IF NOT EXISTS instagram_page_id VARCHAR(100);
    ALTER TABLE venues ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(255);
    ALTER TABLE venues ADD COLUMN IF NOT EXISTS events_sources JSONB DEFAULT '[]'::jsonb;
  `);
  console.log('venue columns migration: OK');
} catch (err) {
  console.error('venue columns migration failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
