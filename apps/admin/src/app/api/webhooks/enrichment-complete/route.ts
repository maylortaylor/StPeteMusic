import { getDb, featured_artists, eq } from '@stpetemusic/db';

export async function POST(request: Request) {
  try {
    const secret = process.env.N8N_WEBHOOK_SECRET;
    const incomingSecret = request.headers.get('x-webhook-secret');

    if (secret && incomingSecret !== secret) {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { featuredArtistId, scrapedRaw, synthesizedNotes, hasError } = body;

    if (!featuredArtistId) {
      return Response.json({ error: 'featuredArtistId is required' }, { status: 400 });
    }

    const db = getDb();

    const existing = await db
      .select({ id: featured_artists.id })
      .from(featured_artists)
      .where(eq(featured_artists.id, featuredArtistId));

    if (existing.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }

    const result = await db
      .update(featured_artists)
      .set({
        scraped_raw: scrapedRaw ?? {},
        enrichment_notes: synthesizedNotes ?? null,
        status: hasError ? 'enrichment_failed' : 'enrichment_ready',
      })
      .where(eq(featured_artists.id, featuredArtistId))
      .returning({ id: featured_artists.id, status: featured_artists.status });

    return Response.json({ received: true, status: result[0]?.status });
  } catch (error) {
    console.error('Failed to process enrichment callback:', error);
    return Response.json({ error: 'Failed to process enrichment callback' }, { status: 500 });
  }
}
