import { auth } from '@clerk/nextjs/server';
import { getDb, events, event_performers, sql, asc, eq, and, ilike, logError } from '@stpetemusic/db';
import type { SQL } from 'drizzle-orm';
import { revalidateWebApp } from '@/lib/revalidate';

// Drizzle's DrizzleQueryError.message is just "Failed query: ...\nparams: ..." —
// the actual Postgres reason (e.g. a constraint violation) lives in .cause.
function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause instanceof Error ? error.cause.message : undefined;
  return cause ? `${error.message} — cause: ${cause}` : error.message;
}

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
    const reviewStatusParam = searchParams.get('review_status');
    const sourceParam = searchParams.get('source');
    const qParam = searchParams.get('q');
    const showOnTicketsParam = searchParams.get('show_on_tickets');

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

    if (sourceParam) {
      conditions.push(eq(events.source, sourceParam));
    }

    if (qParam) {
      conditions.push(ilike(events.title, `%${qParam}%`));
    }

    if (showOnTicketsParam !== null) {
      conditions.push(eq(events.show_on_tickets, showOnTicketsParam === 'true'));
    }

    if (reviewStatusParam) {
      // Explicit review_status filter — used by the review queue page
      conditions.push(eq(events.review_status, reviewStatusParam));
    } else {
      // Default: only return active events in the main events list
      conditions.push(eq(events.is_active, true));
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
        show_on_tickets: events.show_on_tickets,
        review_status: events.review_status,
        source: events.source,
        extra_data: events.extra_data,
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
    logError({
      app: 'admin',
      status_code: 500,
      path: '/api/events',
      method: 'GET',
      message: errorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json();

    if (!data.title || !data.start_time) {
      return Response.json({ error: 'title and start_time are required' }, { status: 400 });
    }

    const ALLOWED_SOURCES = new Set(['manual', 'facebook', 'eventbrite']);
    const source = ALLOWED_SOURCES.has(data.source) ? data.source : 'manual';

    const db = getDb();

    const result = await db
      .insert(events)
      .values({
        title: data.title,
        description: data.description,
        start_time: new Date(data.start_time),
        end_time: data.end_time ? new Date(data.end_time) : undefined,
        location: data.location,
        tag: data.tag,
        ticket_url: data.ticket_url,
        venue: data.venue,
        image_url: data.image_url,
        extra_data: data.extra_data ?? {},
        is_active: data.is_active ?? true,
        show_on_tickets: data.show_on_tickets ?? false,
        review_status: 'approved', // manually created events are pre-approved
        source,
      })
      .returning();

    await revalidateWebApp(result[0].show_on_tickets ? 'tickets' : undefined);

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    logError({
      app: 'admin',
      status_code: 500,
      path: '/api/events',
      method: 'POST',
      message: errorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
