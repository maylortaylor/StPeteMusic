import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_videos, desc, eq, and, sql } from '@stpetemusic/db';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const confidence = searchParams.get('confidence');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
    const offset = (page - 1) * limit;

    const db = getDb();

    const conditions = [];
    if (status) conditions.push(eq(youtube_videos.status, status));
    if (confidence) conditions.push(eq(youtube_videos.calendar_match_confidence, confidence));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(youtube_videos)
        .where(where)
        .orderBy(desc(youtube_videos.published_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(youtube_videos)
        .where(where),
    ]);

    const stats = await db
      .select({
        status: youtube_videos.status,
        count: sql<number>`count(*)::int`,
      })
      .from(youtube_videos)
      .groupBy(youtube_videos.status);

    return Response.json({
      videos: rows,
      total: countResult[0]?.count ?? 0,
      page,
      limit,
      stats: Object.fromEntries(stats.map((s) => [s.status, s.count])),
    });
  } catch (error) {
    console.error('Failed to fetch YouTube videos:', error);
    return Response.json({ error: 'Failed to fetch YouTube videos' }, { status: 500 });
  }
}
