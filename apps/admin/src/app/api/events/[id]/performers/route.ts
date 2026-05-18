import { auth } from '@clerk/nextjs/server';
import { getDb, event_performers, artists, eq } from '@stpetemusic/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const result = await db
      .select({
        artist_id: artists.id,
        name: artists.name,
        slug: artists.slug,
        type: artists.type,
        instagram_handle: artists.instagram_handle,
      })
      .from(event_performers)
      .innerJoin(artists, eq(event_performers.artist_id, artists.id))
      .where(eq(event_performers.event_id, id));

    return Response.json({ performers: result });
  } catch (error) {
    console.error('Failed to fetch performers:', error);
    return Response.json({ error: 'Failed to fetch performers' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const { artistId } = await request.json();

    if (!artistId) {
      return Response.json({ error: 'artistId is required' }, { status: 400 });
    }

    const db = getDb();
    await db.insert(event_performers).values({ event_id: id, artist_id: artistId });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    const pg = error as Record<string, unknown>;
    if (pg.code === '23505') {
      return Response.json({ error: 'Artist is already a performer for this event' }, { status: 409 });
    }
    console.error('Failed to add performer:', error);
    return Response.json({ error: 'Failed to add performer' }, { status: 500 });
  }
}
