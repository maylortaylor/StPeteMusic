import { auth } from '@clerk/nextjs/server';
import { getChannelId } from '@/lib/youtube-client';

const HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
const LEASE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(_request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      return Response.json({ error: 'NEXT_PUBLIC_SITE_URL env var not set' }, { status: 503 });
    }

    const channelId = await getChannelId();
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
    const callbackUrl = `${siteUrl}/api/webhooks/youtube`;

    const form = new URLSearchParams({
      'hub.callback': callbackUrl,
      'hub.topic': topicUrl,
      'hub.mode': 'subscribe',
      'hub.lease_seconds': String(LEASE_SECONDS),
    });

    const res = await fetch(HUB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json(
        { error: `PubSubHubbub subscription failed (${res.status}): ${text}` },
        { status: 502 },
      );
    }

    return Response.json({
      subscribed: true,
      channelId,
      callbackUrl,
      topicUrl,
      leaseDays: LEASE_SECONDS / 86400,
    });
  } catch (error) {
    console.error('YouTube subscribe error:', error);
    return Response.json({ error: 'Failed to register webhook subscription' }, { status: 500 });
  }
}
