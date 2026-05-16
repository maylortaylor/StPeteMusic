import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_config } from '@stpetemusic/db';

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Raw 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.searchParams.has('v')) return url.searchParams.get('v');
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0];
    const match = url.pathname.match(/\/(live|shorts|embed|v)\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[2];
  } catch { /* not a URL */ }
  return null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const db = getDb();
  const [row] = await db
    .select({ videoId: youtube_config.stream_override_video_id })
    .from(youtube_config)
    .limit(1);

  return Response.json({ videoId: row?.videoId ?? null });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = await request.json() as { url: string | null };
  const videoId = body.url ? extractVideoId(body.url) : null;

  if (body.url && !videoId) {
    return Response.json({ error: 'Could not extract a YouTube video ID from that URL' }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: youtube_config.id })
    .from(youtube_config)
    .limit(1);

  if (existing) {
    await db.update(youtube_config).set({ stream_override_video_id: videoId });
  } else {
    await db.insert(youtube_config).values({ stream_override_video_id: videoId });
  }

  return Response.json({ videoId });
}
