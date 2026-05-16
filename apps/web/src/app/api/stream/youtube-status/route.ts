import { NextResponse } from 'next/server';

// Cache server-side for 15 min: max 96 YouTube API calls/day = 9,600 units (within 10k quota).
// All concurrent visitors and client polls share this cached response.
export const revalidate = 900;

export async function GET() {
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

    return NextResponse.json({
      live: Boolean(item),
      videoId: item?.id?.videoId ?? null,
      title: item?.snippet?.title ?? null,
    });
  } catch {
    return NextResponse.json({ live: false, videoId: null, title: null, error: 'api_error' });
  }
}
