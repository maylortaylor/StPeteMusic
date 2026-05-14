import { auth } from '@clerk/nextjs/server';
import { getDb, social_posts, eq } from '@stpetemusic/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();
    const result = await db.select().from(social_posts).where(eq(social_posts.id, id));

    if (result.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch social post:', error);
    return Response.json({ error: 'Failed to fetch social post' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const data = await request.json();
    const { platform, content_type, title, caption, hashtags, media_urls, scheduled_publish_at, artist_id } = data;

    const db = getDb();
    const result = await db
      .update(social_posts)
      .set({
        ...(platform !== undefined && { platform }),
        ...(content_type !== undefined && { content_type }),
        ...(title !== undefined && { title }),
        ...(caption !== undefined && { caption }),
        ...(hashtags !== undefined && { hashtags }),
        ...(media_urls !== undefined && { media_urls }),
        ...(artist_id !== undefined && { artist_id }),
        ...(scheduled_publish_at !== undefined && {
          scheduled_publish_at: scheduled_publish_at ? new Date(scheduled_publish_at) : null,
        }),
      })
      .where(eq(social_posts.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update social post:', error);
    return Response.json({ error: 'Failed to update social post' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();
    const result = await db
      .update(social_posts)
      .set({ status: 'archived' })
      .where(eq(social_posts.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to archive social post:', error);
    return Response.json({ error: 'Failed to archive social post' }, { status: 500 });
  }
}
