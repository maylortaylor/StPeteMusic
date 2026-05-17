import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_config, eq } from '@stpetemusic/db';

/** Returns the next cache expiry time — either :10 or :40 past the hour. */
function nextScheduledCheck(): Date {
  const now = new Date();
  const result = new Date(now);
  result.setSeconds(0, 0);
  const m = now.getMinutes();
  if (m < 10) {
    result.setMinutes(10);
  } else if (m < 40) {
    result.setMinutes(40);
  } else {
    result.setHours(result.getHours() + 1);
    result.setMinutes(10);
  }
  return result;
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!channelId || !apiKey) {
    return Response.json({ error: 'config_missing' }, { status: 500 });
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('type', 'video');
    url.searchParams.set('eventType', 'live');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const reason = errData?.error?.errors?.[0]?.reason;
      const error = reason === 'quotaExceeded' ? 'quota_exceeded' : 'api_error';
      return Response.json({ live: false, videoId: null, title: null, error });
    }

    const data = await res.json();
    const item = data.items?.[0];
    const result = {
      live: Boolean(item),
      videoId: item?.id?.videoId ?? null,
      title: item?.snippet?.title ?? null,
    };

    // Update shared DB cache so the public /live page benefits from this check too
    try {
      const db = getDb();
      const [existing] = await db.select({ id: youtube_config.id }).from(youtube_config).limit(1);
      const cacheData = {
        yt_cache_video_id: result.videoId,
        yt_cache_is_live: result.live,
        yt_cache_title: result.title,
        yt_cache_expires_at: nextScheduledCheck(),
      };
      if (existing) {
        await db.update(youtube_config).set(cacheData).where(eq(youtube_config.id, existing.id));
      } else {
        await db.insert(youtube_config).values(cacheData);
      }
    } catch { /* non-fatal */ }

    return Response.json(result);
  } catch {
    return Response.json({ live: false, videoId: null, title: null, error: 'api_error' });
  }
}
