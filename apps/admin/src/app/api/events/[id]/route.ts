import { auth } from '@clerk/nextjs/server';
import { getDb, events, eq } from '@stpetemusic/db';
import { revalidateWebApp } from '@/lib/revalidate';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const result = await db.select().from(events).where(eq(events.id, id));

    if (result.length === 0) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return Response.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    const allowed = [
      'title', 'description', 'start_time', 'end_time',
      'location', 'tag', 'ticket_url', 'venue', 'image_url', 'is_active', 'show_on_tickets',
    ];
    for (const key of allowed) {
      if (key in data) updateData[key] = data[key] === '' ? null : data[key];
    }

    const result = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Bust /tickets' cache whenever a tickets-relevant field changed, or the
    // row is (or was just flagged as) shown there — covers inline edits to
    // an already-flagged row as well as the flag toggle itself.
    if ('show_on_tickets' in updateData || result[0].show_on_tickets) {
      await revalidateWebApp('tickets');
    } else {
      await revalidateWebApp();
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update event:', error);
    return Response.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const result = await db.delete(events).where(eq(events.id, id)).returning({ id: events.id });

    if (result.length === 0) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete event:', error);
    return Response.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
