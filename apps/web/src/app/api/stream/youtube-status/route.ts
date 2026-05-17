import { NextResponse } from 'next/server';
import { getDb, youtube_config, eq } from '@stpetemusic/db';

// force-dynamic: must run on every request so the DB override and cache are always current.
// Quota is protected by storing the YouTube API result in the DB with a 15-min TTL.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const [cfg] = await db
      .select({
        override: youtube_config.stream_override_video_id,
        cacheVideoId: youtube_config.yt_cache_video_id,
        cacheLive: youtube_config.yt_cache_is_live,
        cacheTitle: youtube_config.yt_cache_title,
        cacheExpiresAt: youtube_config.yt_cache_expires_at,
      })
      .from(youtube_config)
      .limit(1);

    // Admin override — bypass YouTube API entirely
    if (cfg?.override) {
      return NextResponse.json({ live: true, videoId: cfg.override, title: null });
    }

    // Serve from DB cache if still fresh
    if (cfg?.cacheExpiresAt && new Date() < cfg.cacheExpiresAt) {
      return NextResponse.json({
        live: cfg.cacheLive ?? false,
        videoId: cfg.cacheVideoId ?? null,
        title: cfg.cacheTitle ?? null,
      });
    }
  } catch {
    // DB unavailable — fall through to YouTube API
  }

  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!channelId || !apiKey) {
    return NextResponse.json({ live: false, videoId: null, title: null, error: 'config_missing' });
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('type', 'video');
    url.searchParams.set('eventType', 'live');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const reason = errData?.error?.errors?.[0]?.reason;
      const error = reason === 'quotaExceeded' ? 'quota_exceeded' : 'api_error';
      return NextResponse.json({ live: false, videoId: null, title: null, error });
    }

    const data = await res.json();
    const item = data.items?.[0];
    const result = {
      live: Boolean(item),
      videoId: item?.id?.videoId ?? null,
      title: item?.snippet?.title ?? null,
    };

    // Store in DB cache — 15 min TTL keeps daily usage under 10k quota units
    try {
      const db = getDb();
      const [existing] = await db
        .select({ id: youtube_config.id })
        .from(youtube_config)
        .limit(1);
      const cacheData = {
        yt_cache_video_id: result.videoId,
        yt_cache_is_live: result.live,
        yt_cache_title: result.title,
        yt_cache_expires_at: new Date(Date.now() + 15 * 60 * 1000),
      };
      if (existing) {
        await db.update(youtube_config).set(cacheData).where(eq(youtube_config.id, existing.id));
      } else {
        await db.insert(youtube_config).values(cacheData);
      }
    } catch { /* non-fatal — cache miss on next request is fine */ }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ live: false, videoId: null, title: null, error: 'api_error' });
  }
}
