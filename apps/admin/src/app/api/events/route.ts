import { auth } from '@clerk/nextjs/server';
import { getDb, events, event_performers, sql, asc, eq, and } from '@stpetemusic/db';
import type { SQL } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const venueParam = searchParams.get('venue');
    const tagParam = searchParams.get('tag');

    const db = getDb();
    const conditions: SQL[] = [];

    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month)) {
        conditions.push(
          sql`EXTRACT(YEAR FROM ${events.start_time}) = ${year}`,
          sql`EXTRACT(MONTH FROM ${events.start_time}) = ${month}`,
        );
      }
    }

    if (venueParam) {
      conditions.push(eq(events.venue, venueParam));
    }

    if (tagParam) {
      conditions.push(eq(events.tag, tagParam));
    }

    const result = await db
      .select({
        id: events.id,
        google_event_id: events.google_event_id,
        title: events.title,
        start_time: events.start_time,
        end_time: events.end_time,
        venue: events.venue,
        tag: events.tag,
        location: events.location,
        ticket_url: events.ticket_url,
        image_url: events.image_url,
        is_active: events.is_active,
        performer_count: sql<number>`COUNT(${event_performers.artist_id})`.as('performer_count'),
      })
      .from(events)
      .leftJoin(event_performers, eq(event_performers.event_id, events.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(events.id)
      .orderBy(asc(events.start_time))
      .limit(500);

    return Response.json({ events: result });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
