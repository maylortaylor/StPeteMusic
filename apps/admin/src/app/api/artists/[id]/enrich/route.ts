import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import { getDb, artists, artist_links } from '@stpetemusic/db';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const webhookUrl = process.env.N8N_ARTIST_STANDALONE_ENRICHMENT_WEBHOOK_URL;
    if (!webhookUrl) {
      return Response.json({ error: 'Standalone enrichment webhook not configured' }, { status: 503 });
    }

    const { id } = await params;
    const db = getDb();

    const artistResult = await db
      .select({ id: artists.id, name: artists.name })
      .from(artists)
      .where(eq(artists.id, id));

    if (artistResult.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    const links = await db
      .select({ platform: artist_links.platform, url: artist_links.url, label: artist_links.label })
      .from(artist_links)
      .where(eq(artist_links.artist_id, id))
      .orderBy(asc(artist_links.display_order));

    // Mark as pending before calling n8n so UI can show spinner immediately
    await db
      .update(artists)
      .set({ enrichment_status: 'pending' })
      .where(eq(artists.id, id));

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artistId: id,
        artistName: artistResult[0].name,
        links,
      }),
    });

    if (!webhookRes.ok) {
      const body = await webhookRes.text().catch(() => '');
      // Reset status on n8n failure
      await db
        .update(artists)
        .set({ enrichment_status: 'enrichment_failed' })
        .where(eq(artists.id, id));
      throw new Error(
        `n8n webhook returned ${webhookRes.status}${body ? ': ' + body.slice(0, 200) : ''}`,
      );
    }

    return Response.json({ triggered: true });
  } catch (error) {
    console.error('Failed to trigger standalone enrichment:', error);
    return Response.json({ error: 'Failed to trigger enrichment' }, { status: 500 });
  }
}
