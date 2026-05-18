import { lt } from 'drizzle-orm';
import { getDb } from './db.js';
import { error_logs } from './schema.js';

export interface ErrorLogEntry {
  app: 'web' | 'admin';
  level?: 'error' | 'warn';
  status_code?: number;
  path?: string;
  method?: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
}

const RETENTION_DAYS = 30;

export function logError(entry: ErrorLogEntry): void {
  console.error(`[${entry.app}] ${entry.message}`, entry.metadata ?? '');

  const db = getDb();

  db.insert(error_logs)
    .values({
      app: entry.app,
      level: entry.level ?? 'error',
      status_code: entry.status_code,
      path: entry.path,
      method: entry.method,
      message: entry.message,
      stack: entry.stack,
      metadata: entry.metadata ?? {},
      user_id: entry.user_id,
    })
    .then(() => {
      if (Math.random() < 0.02) {
        const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
        return db.delete(error_logs).where(lt(error_logs.created_at, cutoff));
      }
    })
    .catch((err: unknown) => {
      console.error('[logger] Failed to write error log to DB:', err);
    });
}
