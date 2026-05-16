import { auth } from '@clerk/nextjs/server';
import { getDb, featured_venues, venues, events, eq } from '@stpetemusic/db';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const db = getDb();
    const result = await db
      .select({
        id: featured_venues.id,
        venue_id: featured_venues.venue_id,
        featured_month: featured_venues.featured_month,
        event_id: featured_venues.event_id,
        callout_text: featured_venues.callout_text,
        status: featured_venues.status,
        created_at: featured_venues.created_at,
        updated_at: featured_venues.updated_at,
        venue_name: venues.name,
        venue_slug: venues.slug,
        venue_instagram_url: venues.instagram_url,
        venue_instagram_username: venues.instagram_username,
        venue_website: venues.website,
        event_title: events.title,
        event_start_time: events.start_time,
        event_ticket_url: events.ticket_url,
      })
      .from(featured_venues)
      .leftJoin(venues, eq(featured_venues.venue_id, venues.id))
      .leftJoin(events, eq(featured_venues.event_id, events.id))
      .where(eq(featured_venues.featured_month, month))
      .limit(1);

    return Response.json({ featured_venue: result[0] ?? null });
  } catch (error) {
    console.error('Failed to fetch featured venue:', error);
    return Response.json({ error: 'Failed to fetch featured venue' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const data = await request.json();
    const { venueId, featuredMonth, eventId, calloutText } = data;

    if (!venueId || !featuredMonth) {
      return Response.json({ error: 'venueId and featuredMonth are required' }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .insert(featured_venues)
      .values({
        venue_id: venueId,
        featured_month: featuredMonth,
        event_id: eventId ?? null,
        callout_text: calloutText ?? null,
        status: 'draft',
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    const pg = error as Record<string, unknown>;
    if (pg.code === '23505') {
      return Response.json(
        { error: 'A featured venue already exists for this month' },
        { status: 409 },
      );
    }
    console.error('Failed to create featured venue:', error);
    return Response.json({ error: 'Failed to create featured venue' }, { status: 500 });
  }
}
