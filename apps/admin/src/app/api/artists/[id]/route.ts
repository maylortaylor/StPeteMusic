import { auth } from '@clerk/nextjs/server';
import { getDb, artists } from '@stpetemusic/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = getDb();
    const result = await db
      .select()
      .from(artists)
      .where(eq(artists.id, params.id));

    if (result.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch artist:', error);
    return Response.json(
      { error: 'Failed to fetch artist' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const db = getDb();

    const result = await db
      .update(artists)
      .set({
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description,
        username: data.username,
        instagram_handle: data.instagram_handle,
        instagram_url: data.instagram_url,
        facebook_url: data.facebook_url,
        youtube_url: data.youtube_url,
        website: data.website,
        linktree_url: data.linktree_url,
        home_base: data.home_base,
        genres: data.genres,
        tags: data.tags,
        notes: data.notes,
        is_active: data.is_active,
        visible_on_website: data.visible_on_website,
      })
      .where(eq(artists.id, params.id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update artist:', error);
    return Response.json(
      { error: 'Failed to update artist' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const db = getDb();

    const updateData: Record<string, any> = {};
    if ('is_active' in data) updateData.is_active = data.is_active;
    if ('visible_on_website' in data) updateData.visible_on_website = data.visible_on_website;

    const result = await db
      .update(artists)
      .set(updateData)
      .where(eq(artists.id, params.id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update artist:', error);
    return Response.json(
      { error: 'Failed to update artist' },
      { status: 500 },
    );
  }
}
