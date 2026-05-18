import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_videos, eq } from '@stpetemusic/db';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    const rows = await db
      .update(youtube_videos)
      .set({ status: 'approved', reviewed_at: new Date() })
      .where(eq(youtube_videos.video_id, id))
      .returning();

    if (rows.length === 0) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error('Failed to approve YouTube video:', error);
    return Response.json({ error: 'Failed to approve video' }, { status: 500 });
  }
}
