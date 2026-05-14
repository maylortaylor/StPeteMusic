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
    const reviewStatusParam = searchParams.get('review_status');

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
    console.error('Failed to fetch events:', error);
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
        is_active: data.is_active ?? true,
        review_status: 'approved', // manually created events are pre-approved
        source: 'manual',
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create event:', error);
    return Response.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
