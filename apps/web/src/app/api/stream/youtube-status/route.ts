import { NextResponse } from 'next/server';
import { getDb, youtube_config, eq } from '@stpetemusic/db';

// force-dynamic: must run on every request so the DB override and cache are always current.
// Quota is protected by storing the YouTube API result in the DB with a TTL that lands on
// the next :10 or :40 mark (roughly every 30 min, predictable schedule).
export const dynamic = 'force-dynamic';

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

export async function GET() {
  // Fire HLS check immediately so it overlaps with the DB query — no serial wait.
  // CloudFront returns 200 when MediaMTX has an active stream; 404 when offline.
  const hlsManifest = process.env.HLS_STREAM_URL ?? 'https://hls.stpetemusic.live/live/index.m3u8';
  const hlsPromise = fetch(hlsManifest, { method: 'HEAD', signal: AbortSignal.timeout(2000) })
    .then(r => r.ok)
    .catch(() => false);

  try {
    const db = getDb();
    const [cfg] = await db
      .select({
        override: youtube_config.stream_override_video_id,
        overridePlatform: youtube_config.stream_override_platform,
        overrideExpiresAt: youtube_config.stream_override_expires_at,
        cacheVideoId: youtube_config.yt_cache_video_id,
        cacheLive: youtube_config.yt_cache_is_live,
        cacheTitle: youtube_config.yt_cache_title,
        cacheExpiresAt: youtube_config.yt_cache_expires_at,
      })
      .from(youtube_config)
      .limit(1);

    // Admin override — bypass all auto-detection (ignored if expired)
    const overrideActive =
      cfg?.override && (!cfg.overrideExpiresAt || new Date() < cfg.overrideExpiresAt);
    if (overrideActive) {
      return NextResponse.json({
        live: true,
        videoId: cfg.override,
        platform: cfg.overridePlatform ?? 'youtube',
        title: null,
      });
    }

    // HLS check — DB query has completed by now so hlsPromise has had max overlap time.
    // Always copyright-safe, no API quota consumed.
    if (await hlsPromise) {
      return NextResponse.json({ live: true, videoId: null, platform: 'hls', title: null });
    }

    // Serve from DB cache if still fresh
    if (cfg?.cacheExpiresAt && new Date() < cfg.cacheExpiresAt) {
      return NextResponse.json({
        live: cfg.cacheLive ?? false,
        videoId: cfg.cacheVideoId ?? null,
        platform: 'youtube',
        title: cfg.cacheTitle ?? null,
      });
    }
  } catch (err) {
    console.error('[youtube-status] DB read failed, falling through to YouTube API:', err);
    // Still surface HLS even when DB is unavailable
    if (await hlsPromise) {
      return NextResponse.json({ live: true, videoId: null, platform: 'hls', title: null });
    }
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

    // Cache until next :10 or :40 mark — predictable schedule, stays well under 10k quota units/day
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
        yt_cache_expires_at: nextScheduledCheck(),
      };
      if (existing) {
        await db.update(youtube_config).set(cacheData).where(eq(youtube_config.id, existing.id));
      } else {
        await db.insert(youtube_config).values(cacheData);
      }
    } catch { /* non-fatal — cache miss on next request is fine */ }

    return NextResponse.json({ ...result, platform: 'youtube' });
  } catch {
    return NextResponse.json({ live: false, videoId: null, title: null, error: 'api_error' });
  }
}
