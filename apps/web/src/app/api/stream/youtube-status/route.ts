import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!channelId || !apiKey) {
    return NextResponse.json({ live: false, videoId: null, title: null });
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('type', 'video');
    url.searchParams.set('eventType', 'live');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return NextResponse.json({ live: false, videoId: null, title: null });

    const data = await res.json();
    const item = data.items?.[0];

    return NextResponse.json({
      live: Boolean(item),
      videoId: item?.id?.videoId ?? null,
      title: item?.snippet?.title ?? null,
    });
  } catch {
    return NextResponse.json({ live: false, videoId: null, title: null });
  }
}
