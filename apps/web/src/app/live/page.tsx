import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { LivePlayer } from '@/components/LivePlayer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Stream | St. Pete Music',
  description:
    'Watch St. Pete Music live from Suite E Studios in St. Petersburg, FL. Tune in for live performances and events.',
  openGraph: {
    title: 'St. Pete Music | Live Stream',
    description: 'Watch St. Pete Music live from Suite E Studios in St. Petersburg, FL.',
    url: 'https://www.stpetemusic.live/live',
    siteName: 'St. Pete Music',
    type: 'website',
    images: [{ url: '/images/og/live-bg2.png', width: 1200, height: 630, alt: 'Watch Live — St. Pete Music' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@StPeteMusic',
    creator: '@StPeteMusic',
    images: ['https://www.stpetemusic.live/images/og/live-bg2.png'],
  },
};

interface StreamStatus {
  live: boolean;
  videoId: string | null;
  platform: 'youtube' | 'facebook' | 'twitch' | null;
  title: string | null;
  error?: string;
}

async function getStreamStatus(): Promise<StreamStatus> {
  try {
    const base = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.stpetemusic.live';
    const res = await fetch(`${base}/api/stream/youtube-status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { live: false, videoId: null, platform: null, title: null };
    return res.json();
  } catch {
    return { live: false, videoId: null, platform: null, title: null };
  }
}

export default async function LivePage() {
  const { live, videoId, platform, title, error } = await getStreamStatus();

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background">
        <LivePlayer isLive={live} videoId={videoId} platform={platform} title={title} error={error} />
      </main>
      <Footer />
    </>
  );
}
