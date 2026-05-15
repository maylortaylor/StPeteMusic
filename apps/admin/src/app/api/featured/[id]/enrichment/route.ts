import { auth } from '@clerk/nextjs/server';
import { getDb, featured_artists, eq } from '@stpetemusic/db';

// POST — manual bypass: skip n8n and move directly to enrichment_ready
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    const result = await db
      .update(featured_artists)
      .set({ status: 'enrichment_ready', scraped_raw: {} })
      .where(eq(featured_artists.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }

    return Response.json({ skipped: true });
  } catch (error) {
    console.error('Failed to skip enrichment:', error);
    return Response.json({ error: 'Failed to skip enrichment' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const { enrichmentNotes } = await request.json();

    if (!enrichmentNotes?.trim()) {
      return Response.json({ error: 'enrichmentNotes is required' }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .update(featured_artists)
      .set({
        enrichment_notes: enrichmentNotes.trim(),
        status: 'enrichment_approved',
      })
      .where(eq(featured_artists.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to approve enrichment:', error);
    return Response.json({ error: 'Failed to approve enrichment' }, { status: 500 });
  }
}
