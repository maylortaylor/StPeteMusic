import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_videos, eq } from '@stpetemusic/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    const rows = await db
      .select()
      .from(youtube_videos)
      .where(eq(youtube_videos.video_id, id))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error('Failed to fetch YouTube video:', error);
    return Response.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const body = await request.json() as {
      proposed_title?: string;
      proposed_description?: string;
      proposed_tags?: string[];
      proposed_playlist_ids?: string[];
      timestamps?: { time: string; band_name: string; artist_id?: string }[];
      status?: string;
      review_notes?: string;
    };

    const allowed = [
      'proposed_title',
      'proposed_description',
      'proposed_tags',
      'proposed_playlist_ids',
      'timestamps',
      'status',
      'review_notes',
    ] as const;

    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const db = getDb();
    const rows = await db
      .update(youtube_videos)
      .set(update)
      .where(eq(youtube_videos.video_id, id))
      .returning();

    if (rows.length === 0) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error('Failed to update YouTube video:', error);
    return Response.json({ error: 'Failed to update video' }, { status: 500 });
  }
}
