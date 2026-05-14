import { getDb, featured_artists, artists, eq, asc } from '@stpetemusic/db';

// No auth — this endpoint is called by the n8n newsletter-draft-creator workflow
export async function GET(request: Request) {
  try {
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
