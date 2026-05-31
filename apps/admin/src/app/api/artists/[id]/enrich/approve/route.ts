import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getDb, artists, artist_links, featured_artists } from '@stpetemusic/db';

async function triggerRevalidation(slug: string) {
  const webAppUrl = process.env.WEB_APP_URL;
  const secret = process.env.REVALIDATION_SECRET;
  if (!webAppUrl || !secret) return;
  try {
    await fetch(`${webAppUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ slug }),
    });
  } catch (err) {
    console.error('Revalidation request failed:', err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const data = await request.json() as {
      description?: string;
      hero_photo_url?: string;
      genres?: string[];
      synthesizedNotes?: string;
    };

    const db = getDb();

    // Fetch current artist for slug + existing extra_data
    const current = await db
      .select({
        slug: artists.slug,
        extra_data: artists.extra_data,
      })
      .from(artists)
      .where(eq(artists.id, id));

    if (current.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Fetch all active links to sync back to dedicated columns
    const links = await db
      .select({ platform: artist_links.platform, url: artist_links.url })
      .from(artist_links)
      .where(and(eq(artist_links.artist_id, id), eq(artist_links.is_active, true)));

    const linksByPlatform: Record<string, string> = {};
    for (const link of links) {
      linksByPlatform[link.platform] = link.url;
    }

    // Remove temp enrichment payload from extra_data
    const existingExtraData = (current[0].extra_data ?? {}) as Record<string, unknown>;
    const { enrichment: _dropped, ...cleanedExtraData } = existingExtraData;

    const updated = await db
      .update(artists)
      .set({
        enrichment_status: 'enrichment_approved',
        extra_data: cleanedExtraData,
        // Sync known-platform links back to dedicated columns
        instagram_url: linksByPlatform['instagram'] ?? undefined,
        facebook_url: linksByPlatform['facebook'] ?? undefined,
        youtube_url: linksByPlatform['youtube'] ?? undefined,
        bandcamp_url: linksByPlatform['bandcamp'] ?? undefined,
        spotify_url: linksByPlatform['spotify'] ?? undefined,
        soundcloud_url: linksByPlatform['soundcloud'] ?? undefined,
        linktree_url: linksByPlatform['linktree'] ?? undefined,
        website: linksByPlatform['website'] ?? undefined,
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.hero_photo_url !== undefined ? { hero_photo_url: data.hero_photo_url } : {}),
        ...(data.genres !== undefined ? { genres: data.genres } : {}),
      })
      .where(eq(artists.id, id))
      .returning({ slug: artists.slug });

    // If this artist is currently featured this month, propagate enrichment notes
    if (data.synthesizedNotes) {
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      await db
        .update(featured_artists)
        .set({
          enrichment_notes: data.synthesizedNotes,
          status: 'enrichment_approved',
        })
        .where(
          and(
            eq(featured_artists.artist_id, id),
            eq(featured_artists.featured_month, currentMonth),
          ),
        );
    }

    await triggerRevalidation(updated[0].slug);

    return Response.json({ approved: true });
  } catch (error) {
    console.error('Failed to approve enrichment:', error);
    return Response.json({ error: 'Failed to approve enrichment' }, { status: 500 });
  }
}
