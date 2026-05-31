import { auth } from '@clerk/nextjs/server';
import { asc, eq, and } from 'drizzle-orm';
import { getDb, artist_links } from '@stpetemusic/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();
    const links = await db
      .select()
      .from(artist_links)
      .where(eq(artist_links.artist_id, id))
      .orderBy(asc(artist_links.display_order));

    return Response.json({ links });
  } catch (error) {
    console.error('Failed to fetch artist links:', error);
    return Response.json({ error: 'Failed to fetch artist links' }, { status: 500 });
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
      platform: string;
      url: string;
      label: string;
      display_order?: number;
      is_featured?: boolean;
    };

    if (!data.platform || !data.url || !data.label) {
      return Response.json({ error: 'platform, url, and label are required' }, { status: 400 });
    }

    const db = getDb();

    if (data.is_featured) {
      const existing = await db
        .select({ id: artist_links.id })
        .from(artist_links)
        .where(and(eq(artist_links.artist_id, id), eq(artist_links.is_featured, true)));
      if (existing.length >= 3) {
        return Response.json(
          { error: 'Maximum 3 featured links per artist. Remove a starred link first.' },
          { status: 400 },
        );
      }
    }

    const result = await db
      .insert(artist_links)
      .values({
        artist_id: id,
        platform: data.platform,
        url: data.url,
        label: data.label,
        display_order: data.display_order ?? 0,
        is_featured: data.is_featured ?? false,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create artist link:', error);
    return Response.json({ error: 'Failed to create artist link' }, { status: 500 });
  }
}
