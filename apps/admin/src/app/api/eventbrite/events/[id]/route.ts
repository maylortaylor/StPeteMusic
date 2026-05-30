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

const VALID_STATUSES = new Set(['live', 'started', 'ended', 'completed', 'canceled', 'draft', 'postponed']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const allowed = ['linked_event_id', 'status'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const db = getDb();

    if ('linked_event_id' in updates) {
      const linkedEventId: string | null = (updates.linked_event_id as string | null) ?? null;
      updates.linked_event_id = linkedEventId;
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
    }

    if ('status' in updates) {
      const s = updates.status as string;
      if (!VALID_STATUSES.has(s)) {
        return Response.json({ error: `Invalid status: ${s}` }, { status: 400 });
      }
    }

    await db
      .update(eventbrite_events)
      .set({ ...updates, updated_at: new Date() })
      .where(sql`${eventbrite_events.eventbrite_id} = ${id}`);

    // Bust the web app's /tickets cache when status changes (non-fatal)
    if ('status' in updates) {
      const webAppUrl = process.env.WEB_APP_URL;
      const revalidationSecret = process.env.REVALIDATION_SECRET;
      if (webAppUrl && revalidationSecret) {
        await fetch(`${webAppUrl}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${revalidationSecret}` },
          body: JSON.stringify({ scope: 'eventbrite' }),
        })
          .then((r) => { if (!r.ok) r.text().then((b) => console.warn('Revalidation non-ok:', r.status, b)); })
          .catch((err) => console.warn('Revalidation call failed (non-fatal):', err));
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/eventbrite/events/[id] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
