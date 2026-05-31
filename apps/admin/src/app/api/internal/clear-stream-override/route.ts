import { getDb, youtube_config, eq } from '@stpetemusic/db';

export async function POST(request: Request) {
  const secret = request.headers.get('x-deploy-secret');
  if (!secret || secret !== process.env.INTERNAL_DEPLOY_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const db = getDb();
    const [existing] = await db
      .select({ id: youtube_config.id })
      .from(youtube_config)
      .limit(1);

    if (existing) {
      await db
        .update(youtube_config)
        .set({
          stream_override_video_id: null,
          stream_override_platform: null,
          stream_override_expires_at: null,
        })
        .where(eq(youtube_config.id, existing.id));
    }

    return Response.json({ cleared: true });
  } catch (err) {
    console.error('Failed to clear stream override:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
