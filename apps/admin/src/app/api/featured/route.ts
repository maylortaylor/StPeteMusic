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
        artist_id: featured_artists.artist_id,
        featured_month: featured_artists.featured_month,
        order_position: featured_artists.order_position,
        status: featured_artists.status,
        enrichment_notes: featured_artists.enrichment_notes,
        newsletter_blurb: featured_artists.newsletter_blurb,
        created_at: featured_artists.created_at,
        updated_at: featured_artists.updated_at,
        artist_name: artists.name,
        artist_slug: artists.slug,
        artist_type: artists.type,
        artist_instagram_handle: artists.instagram_handle,
        artist_instagram_url: artists.instagram_url,
        artist_facebook_url: artists.facebook_url,
        artist_bandcamp_url: artists.bandcamp_url,
        artist_linktree_url: artists.linktree_url,
        artist_website: artists.website,
        artist_home_base: artists.home_base,
        artist_genres: artists.genres,
      })
      .from(featured_artists)
      .leftJoin(artists, eq(featured_artists.artist_id, artists.id))
      .where(eq(featured_artists.featured_month, month))
      .orderBy(asc(featured_artists.order_position));

    return Response.json({ featured: result });
  } catch (error) {
    console.error('Failed to fetch featured artists:', error);
    return Response.json({ error: 'Failed to fetch featured artists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const data = await request.json();
    const { artistId, featuredMonth, orderPosition } = data;

    if (!artistId || !featuredMonth || !orderPosition) {
      return Response.json(
        { error: 'artistId, featuredMonth, and orderPosition are required' },
        { status: 400 },
      );
    }
    if (![1, 2].includes(Number(orderPosition))) {
      return Response.json({ error: 'orderPosition must be 1 or 2' }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .insert(featured_artists)
      .values({
        artist_id: artistId,
        featured_month: featuredMonth,
        order_position: Number(orderPosition),
        status: 'pending_enrichment',
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    const pg = error as Record<string, unknown>;
    if (pg.code === '23505') {
      return Response.json(
        { error: 'This artist or slot is already used for this month' },
        { status: 409 },
      );
    }
    console.error('Failed to create featured artist:', error);
    return Response.json({ error: 'Failed to create featured artist' }, { status: 500 });
  }
}
