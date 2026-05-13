import { auth } from '@clerk/nextjs/server';
import { getDb, venues, eq } from '@stpetemusic/db';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const webhookUrl = process.env.N8N_VENUE_SYNC_WEBHOOK_URL;
    if (!webhookUrl) {
      return Response.json({ error: 'Venue sync not configured' }, { status: 503 });
    }

    const db = getDb();
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    if (!venue) {
      return Response.json({ error: 'Venue not found' }, { status: 404 });
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueId: id,
        slug: venue.slug,
        events_sources: venue.events_sources,
      }),
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to trigger venue sync:', error);
    return Response.json(
      { error: 'Failed to trigger sync' },
      { status: 500 },
    );
  }
}
