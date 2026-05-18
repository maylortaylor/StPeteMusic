import { auth } from '@clerk/nextjs/server';
import { getDb, featured_artists, artists, eq, asc } from '@stpetemusic/db';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const db = getDb();
    const result = await db
      .select({
        id: featured_artists.id,
        order_position: featured_artists.order_position,
        status: featured_artists.status,
        newsletter_blurb: featured_artists.newsletter_blurb,
        artist_name: artists.name,
        artist_instagram_handle: artists.instagram_handle,
        artist_genres: artists.genres,
        artist_home_base: artists.home_base,
      })
      .from(featured_artists)
      .leftJoin(artists, eq(featured_artists.artist_id, artists.id))
      .where(eq(featured_artists.featured_month, month))
      .orderBy(asc(featured_artists.order_position));

    return Response.json({ blurbs: result, month });
  } catch (error) {
    console.error('Failed to fetch featured blurbs:', error);
    return Response.json({ error: 'Failed to fetch featured blurbs' }, { status: 500 });
  }
}
