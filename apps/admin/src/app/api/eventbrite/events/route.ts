import { auth } from '@clerk/nextjs/server';
import { getDb, eventbrite_events, desc, sql } from '@stpetemusic/db';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status'); // comma-separated statuses, or null for all
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
    const offset = (page - 1) * limit;

    const db = getDb();

    // Count stats across ALL events regardless of filter
    const statsRows = await db
      .select({
        status: eventbrite_events.status,
        count: sql<number>`count(*)::int`,
      })
      .from(eventbrite_events)
      .groupBy(eventbrite_events.status);

    const stats: Record<string, number> = {};
    let total = 0;
    for (const row of statsRows) {
      const s = row.status ?? 'unknown';
      stats[s] = row.count;
      total += row.count;
    }

    // Apply status filter if requested
    let query = db
      .select()
      .from(eventbrite_events)
      .orderBy(desc(eventbrite_events.start_utc))
      .limit(limit)
      .offset(offset);

    if (statusParam) {
      const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        query = query.where(sql`${eventbrite_events.status} = ${statuses[0]}`) as typeof query;
      } else if (statuses.length > 1) {
        query = query.where(sql`${eventbrite_events.status} = ANY(${statuses})`) as typeof query;
      }
    }

    const rows = await query;

    // Filtered total when status filter is applied
    const filteredTotal = statusParam
      ? statsRows
          .filter((r) => statusParam.split(',').includes(r.status ?? ''))
          .reduce((s, r) => s + r.count, 0)
      : total;

    return Response.json({
      events: rows,
      total: filteredTotal,
      page,
      limit,
      stats,
    });
  } catch (err) {
    console.error('GET /api/eventbrite/events error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
