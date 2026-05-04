import { auth } from '@clerk/nextjs/server';
import { getDb, artists } from '@stpetemusic/db';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = getDb();
    const result = await db
      .select()
      .from(artists)
      .limit(100);

    return Response.json({ artists: result });
  } catch (error) {
    console.error('Failed to fetch artists:', error);
    return Response.json(
      { error: 'Failed to fetch artists' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const db = getDb();

    const result = await db
      .insert(artists)
      .values({
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
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
        is_active: data.is_active ?? true,
        visible_on_website: data.visible_on_website ?? false,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create artist:', error);
    return Response.json(
      { error: 'Failed to create artist' },
      { status: 500 },
    );
  }
}
