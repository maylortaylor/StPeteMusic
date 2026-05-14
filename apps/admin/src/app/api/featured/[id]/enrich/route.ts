import { auth } from '@clerk/nextjs/server';
import { getDb, featured_artists, artists, eq } from '@stpetemusic/db';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const webhookUrl = process.env.N8N_ARTIST_ENRICHMENT_WEBHOOK_URL;
    if (!webhookUrl) {
      return Response.json({ error: 'Enrichment webhook not configured' }, { status: 503 });
    }

    const { id } = await params;
    const db = getDb();

    const result = await db
      .select({
        id: featured_artists.id,
        artist_id: featured_artists.artist_id,
        featured_month: featured_artists.featured_month,
        status: featured_artists.status,
        artist_name: artists.name,
        artist_instagram_url: artists.instagram_url,
        artist_facebook_url: artists.facebook_url,
        artist_linktree_url: artists.linktree_url,
        artist_website: artists.website,
        artist_bandcamp_url: artists.bandcamp_url,
      })
      .from(featured_artists)
      .leftJoin(artists, eq(featured_artists.artist_id, artists.id))
      .where(eq(featured_artists.id, id));

    if (result.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }

    const record = result[0];

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        featuredArtistId: record.id,
        name: record.artist_name,
        instagramUrl: record.artist_instagram_url,
        facebookUrl: record.artist_facebook_url,
        linktreeUrl: record.artist_linktree_url,
        website: record.artist_website,
        bandcampUrl: record.artist_bandcamp_url,
      }),
    });

    if (!webhookRes.ok) {
      throw new Error(`Enrichment webhook returned ${webhookRes.status}`);
    }

    await db
      .update(featured_artists)
      .set({ status: 'pending_enrichment' })
      .where(eq(featured_artists.id, id));

    return Response.json({ triggered: true });
  } catch (error) {
    console.error('Failed to trigger enrichment:', error);
    return Response.json({ error: 'Failed to trigger enrichment' }, { status: 500 });
  }
}
