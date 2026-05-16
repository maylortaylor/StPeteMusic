import { auth } from '@clerk/nextjs/server';
import { getDb, eventbrite_events, events, sql, eq } from '@stpetemusic/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    const rows = await db
      .select({
        eb: eventbrite_events,
        linked_event_title: events.title,
        linked_event_start: events.start_time,
      })
      .from(eventbrite_events)
      .leftJoin(events, eq(eventbrite_events.linked_event_id, events.id))
      .where(sql`${eventbrite_events.eventbrite_id} = ${id}`)
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const { eb, linked_event_title, linked_event_start } = rows[0];
    return Response.json({
      ...eb,
      linked_event_title,
      linked_event_start,
    });
  } catch (err) {
    console.error('GET /api/eventbrite/events/[id] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // Only allow updating the admin-controlled link field
    if (!('linked_event_id' in body)) {
      return Response.json({ error: 'Only linked_event_id may be updated' }, { status: 400 });
    }

    const linkedEventId: string | null = body.linked_event_id ?? null;
    const db = getDb();

    // Validate the referenced event exists if a non-null value is provided
    if (linkedEventId !== null) {
      const target = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.id, linkedEventId))
        .limit(1);
      if (target.length === 0) {
        return Response.json({ error: 'Referenced event not found' }, { status: 400 });
      }
    }

    await db
      .update(eventbrite_events)
      .set({ linked_event_id: linkedEventId, updated_at: new Date() })
      .where(sql`${eventbrite_events.eventbrite_id} = ${id}`);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/eventbrite/events/[id] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
