import { getDb, featured_artists, artists, eq, asc } from '@stpetemusic/db';

export async function GET(request: Request) {
  try {
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!secret) {
      console.error('N8N_WEBHOOK_SECRET is not configured');
      return new Response('Forbidden', { status: 403 });
    }
    const incomingSecret = request.headers.get('x-webhook-secret');
    if (incomingSecret !== secret) {
      return new Response('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const db = getDb();
    const result = await db
      .select({
        order_position: featured_artists.order_position,
        newsletter_blurb: featured_artists.newsletter_blurb,
        artist_name: artists.name,
        artist_instagram_handle: artists.instagram_handle,
      })
      .from(featured_artists)
      .leftJoin(artists, eq(featured_artists.artist_id, artists.id))
      .where(eq(featured_artists.featured_month, month))
      .orderBy(asc(featured_artists.order_position));

    // Return only entries that have an approved blurb
    const approved = result.filter(
      (r) => r.newsletter_blurb && r.newsletter_blurb.trim().length > 0,
    );

    return Response.json({ blurbs: approved, month });
  } catch (error) {
    console.error('Failed to fetch approved blurbs:', error);
    return Response.json({ error: 'Failed to fetch approved blurbs' }, { status: 500 });
  }
}
