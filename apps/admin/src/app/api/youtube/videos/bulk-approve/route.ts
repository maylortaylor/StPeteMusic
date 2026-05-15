import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_videos, inArray } from '@stpetemusic/db';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { videoIds } = await request.json() as { videoIds?: string[] };

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return Response.json({ error: 'videoIds array is required' }, { status: 400 });
    }

    const db = getDb();
    const rows = await db
      .update(youtube_videos)
      .set({ status: 'approved', reviewed_at: new Date() })
      .where(inArray(youtube_videos.video_id, videoIds))
      .returning();

    return Response.json({ approved: rows.length, requested: videoIds.length });
  } catch (error) {
    console.error('Bulk approve failed:', error);
    return Response.json({ error: 'Bulk approve failed' }, { status: 500 });
  }
}
