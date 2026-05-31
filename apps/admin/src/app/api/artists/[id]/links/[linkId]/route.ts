import { auth } from '@clerk/nextjs/server';
import { and, eq, ne } from 'drizzle-orm';
import { getDb, artist_links } from '@stpetemusic/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id, linkId } = await params;
    const data = await request.json() as {
      platform?: string;
      url?: string;
      label?: string;
      display_order?: number;
      is_active?: boolean;
      is_featured?: boolean;
    };

    const db = getDb();

    if (data.is_featured === true) {
      // Count featured links for this artist, excluding the link being updated
      const existing = await db
        .select({ id: artist_links.id })
        .from(artist_links)
        .where(
          and(
            eq(artist_links.artist_id, id),
            eq(artist_links.is_featured, true),
            ne(artist_links.id, linkId),
          ),
        );
      if (existing.length >= 3) {
        return Response.json(
          { error: 'Maximum 3 featured links per artist. Remove a starred link first.' },
          { status: 400 },
        );
      }
    }

    const updateData: Partial<typeof artist_links.$inferInsert> = {};
    if (data.platform !== undefined) updateData.platform = data.platform;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured;

    const result = await db
      .update(artist_links)
      .set(updateData)
      .where(and(eq(artist_links.id, linkId), eq(artist_links.artist_id, id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Link not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update artist link:', error);
    return Response.json({ error: 'Failed to update artist link' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id, linkId } = await params;
    const db = getDb();

    const result = await db
      .delete(artist_links)
      .where(and(eq(artist_links.id, linkId), eq(artist_links.artist_id, id)))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Link not found' }, { status: 404 });
    }

    return Response.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete artist link:', error);
    return Response.json({ error: 'Failed to delete artist link' }, { status: 500 });
  }
}
