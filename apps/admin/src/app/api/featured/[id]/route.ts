import { auth } from '@clerk/nextjs/server';
import { getDb, featured_artists, artists, eq, and } from '@stpetemusic/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();
    const result = await db
      .select({
        id: featured_artists.id,
        artist_id: featured_artists.artist_id,
        featured_month: featured_artists.featured_month,
        order_position: featured_artists.order_position,
        status: featured_artists.status,
        scraped_raw: featured_artists.scraped_raw,
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
        artist_spotify_url: artists.spotify_url,
        artist_soundcloud_url: artists.soundcloud_url,
        artist_linktree_url: artists.linktree_url,
        artist_website: artists.website,
        artist_home_base: artists.home_base,
        artist_genres: artists.genres,
        artist_tags: artists.tags,
      })
      .from(featured_artists)
      .leftJoin(artists, eq(featured_artists.artist_id, artists.id))
      .where(eq(featured_artists.id, id));

    if (result.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch featured artist:', error);
    return Response.json({ error: 'Failed to fetch featured artist' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    const existing = await db
      .select({ status: featured_artists.status })
      .from(featured_artists)
      .where(eq(featured_artists.id, id));

    if (existing.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }
    if (existing[0].status !== 'pending_enrichment') {
      return Response.json(
        { error: 'Can only remove a featured artist before enrichment has started' },
        { status: 409 },
      );
    }

    await db
      .delete(featured_artists)
      .where(and(eq(featured_artists.id, id), eq(featured_artists.status, 'pending_enrichment')));

    return Response.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete featured artist:', error);
    return Response.json({ error: 'Failed to delete featured artist' }, { status: 500 });
  }
}
