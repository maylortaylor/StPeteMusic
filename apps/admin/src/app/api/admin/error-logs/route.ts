import { auth } from '@clerk/nextjs/server';
import { getDb, error_logs } from '@stpetemusic/db';
import { desc, gte, and, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hours = Math.min(Number(searchParams.get('hours') ?? '24'), 168); // cap at 7 days
  const app = searchParams.get('app');
  const level = searchParams.get('level');
  const limit = Math.min(Number(searchParams.get('limit') ?? '100'), 500);

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const db = getDb();

  const conditions = [gte(error_logs.created_at, since)];
  if (app === 'web' || app === 'admin') {
    conditions.push(eq(error_logs.app, app));
  }
  if (level === 'error' || level === 'warn') {
    conditions.push(eq(error_logs.level, level));
  }

  try {
    const rows = await db
      .select({
        id: error_logs.id,
        created_at: error_logs.created_at,
        app: error_logs.app,
        level: error_logs.level,
        status_code: error_logs.status_code,
        path: error_logs.path,
        method: error_logs.method,
        message: error_logs.message,
        metadata: error_logs.metadata,
        user_id: error_logs.user_id,
      })
      .from(error_logs)
      .where(and(...conditions))
      .orderBy(desc(error_logs.created_at))
      .limit(limit);

    // Compute summary from returned rows
    const by_app: Record<string, number> = {};
    const by_status_code: Record<string, number> = {};
    for (const row of rows) {
      by_app[row.app] = (by_app[row.app] ?? 0) + 1;
      if (row.status_code != null) {
        const key = String(row.status_code);
        by_status_code[key] = (by_status_code[key] ?? 0) + 1;
      }
    }

    return Response.json({
      summary: {
        total: rows.length,
        since: since.toISOString(),
        hours,
        by_app,
        by_status_code,
      },
      errors: rows,
    });
  } catch (error) {
    console.error('Failed to fetch error logs:', error);
    return Response.json({ error: 'Failed to fetch error logs' }, { status: 500 });
  }
}
