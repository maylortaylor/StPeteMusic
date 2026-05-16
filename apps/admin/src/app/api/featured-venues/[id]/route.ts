import { auth } from '@clerk/nextjs/server';
import { getDb, featured_venues, eq } from '@stpetemusic/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const data = await request.json();
    const { venueId, eventId, calloutText, status } = data;

    const updates: Record<string, unknown> = {};
    if (venueId !== undefined) updates.venue_id = venueId;
    if (eventId !== undefined) updates.event_id = eventId;
    if (calloutText !== undefined) updates.callout_text = calloutText;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .update(featured_venues)
      .set(updates)
      .where(eq(featured_venues.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Featured venue not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update featured venue:', error);
    return Response.json({ error: 'Failed to update featured venue' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();
    const result = await db
      .delete(featured_venues)
      .where(eq(featured_venues.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Featured venue not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete featured venue:', error);
    return Response.json({ error: 'Failed to delete featured venue' }, { status: 500 });
  }
}
