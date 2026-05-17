import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_config, eq } from '@stpetemusic/db';

type Platform = 'youtube' | 'facebook' | 'twitch';

interface ParsedOverride {
  platform: Platform;
  streamId: string;
}

function parseOverrideInput(input: string): ParsedOverride | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Raw YouTube 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { platform: 'youtube', streamId: trimmed };
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

    // YouTube
    if (host === 'youtube.com' || host === 'youtu.be') {
      let videoId: string | null = null;
      if (url.searchParams.has('v')) {
        videoId = url.searchParams.get('v');
      } else if (host === 'youtu.be') {
        videoId = url.pathname.slice(1).split('?')[0];
      } else {
        const match = url.pathname.match(/\/(live|shorts|embed|v)\/([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[2];
      }
      if (videoId) return { platform: 'youtube', streamId: videoId };
    }

    // Twitch — store channel name only
    if (host === 'twitch.tv') {
      const channel = url.pathname.split('/').filter(Boolean)[0];
      if (channel) return { platform: 'twitch', streamId: channel };
    }

    // Facebook — store full URL so the embed can use it directly
    if (host === 'facebook.com' || host === 'fb.watch') {
      return { platform: 'facebook', streamId: trimmed };
    }
  } catch { /* not a URL */ }

  return null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const db = getDb();
  const [row] = await db
    .select({
      videoId: youtube_config.stream_override_video_id,
      platform: youtube_config.stream_override_platform,
      expiresAt: youtube_config.stream_override_expires_at,
    })
    .from(youtube_config)
    .limit(1);

  const expiresAt = row?.expiresAt ?? null;
  const expired = expiresAt && new Date() >= expiresAt;
  const videoId = expired ? null : (row?.videoId ?? null);
  const platform = videoId ? (row?.platform ?? 'youtube') : null;

  return Response.json({
    videoId,
    platform,
    expiresAt: videoId ? (expiresAt?.toISOString() ?? null) : null,
  });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = await request.json() as { url: string | null };

  if (body.url === null) {
    // Clear override
    const db = getDb();
    const [existing] = await db.select({ id: youtube_config.id }).from(youtube_config).limit(1);
    if (existing) {
      await db
        .update(youtube_config)
        .set({ stream_override_video_id: null, stream_override_platform: null, stream_override_expires_at: null })
        .where(eq(youtube_config.id, existing.id));
    }
    return Response.json({ videoId: null, platform: null, expiresAt: null });
  }

  const parsed = parseOverrideInput(body.url);
  if (!parsed) {
    return Response.json(
      { error: 'Could not detect a YouTube, Twitch, or Facebook URL from that input' },
      { status: 400 }
    );
  }

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const db = getDb();
  const [existing] = await db.select({ id: youtube_config.id }).from(youtube_config).limit(1);

  if (existing) {
    await db
      .update(youtube_config)
      .set({
        stream_override_video_id: parsed.streamId,
        stream_override_platform: parsed.platform,
        stream_override_expires_at: expiresAt,
      })
      .where(eq(youtube_config.id, existing.id));
  } else {
    await db.insert(youtube_config).values({
      stream_override_video_id: parsed.streamId,
      stream_override_platform: parsed.platform,
      stream_override_expires_at: expiresAt,
    });
  }

  return Response.json({
    videoId: parsed.streamId,
    platform: parsed.platform,
    expiresAt: expiresAt.toISOString(),
  });
}
