import type { Metadata } from 'next';
import Image from 'next/image';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { LivePlayer } from '@/components/LivePlayer';
import { DonateButton } from '@/components/DonateButton';
import { getPastLivestreams, type PastLivestream } from '@/lib/queries/streams';
import { AnimateIn } from '@/components/AnimateIn';

export const dynamic = 'force-dynamic';

const SUITE_E_PLAYLIST_ID = 'PL5gTeopOibQREpXSSqHwVaZTWv1EdUuki';

export const metadata: Metadata = {
  title: 'Watch Live | St. Pete Music',
  description:
    'Watch St. Pete Music live from Suite E Studios in St. Petersburg, FL. Tune in for live performances and events.',
  openGraph: {
    title: 'St. Pete Music | Watch Live',
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

interface PlaylistItem {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string | null;
}

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

async function getSuiteEPlaylistItems(): Promise<PlaylistItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', SUITE_E_PLAYLIST_ID);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.items ?? [])
      .filter((item: { snippet?: { resourceId?: { videoId?: string } } }) => item.snippet?.resourceId?.videoId)
      .map((item: { snippet: { resourceId: { videoId: string }; title: string; publishedAt: string | null; thumbnails?: { medium?: { url: string }; default?: { url: string } } } }) => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail:
          item.snippet.thumbnails?.medium?.url ??
          item.snippet.thumbnails?.default?.url ??
          `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/hqdefault.jpg`,
        publishedAt: item.snippet.publishedAt ?? null,
      }));
  } catch {
    return [];
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
}

function formatViews(n: number | null): string {
  if (!n) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k views`;
  return `${n} views`;
}

function StreamCard({ stream }: { stream: PastLivestream }) {
  const displayTitle = stream.proposed_title ?? stream.title ?? 'Untitled Stream';
  const rawDesc = stream.proposed_description ?? stream.description ?? '';
  const snippet = rawDesc.length > 120 ? rawDesc.slice(0, 117) + '…' : rawDesc;
  const thumb = stream.thumbnail_url ?? `https://i.ytimg.com/vi/${stream.video_id}/hqdefault.jpg`;

  return (
    <a
      href={`https://youtube.com/watch?v=${stream.video_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 hover:opacity-90 transition-opacity"
    >
      <div className="relative aspect-video bg-black overflow-hidden">
        <Image
          src={thumb}
          alt={displayTitle}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-inter font-bold text-sm leading-snug text-black line-clamp-2">
          {displayTitle}
        </p>
        {snippet && (
          <p className="font-inter text-xs text-text-secondary line-clamp-2">{snippet}</p>
        )}
        <p className="font-inter text-xs text-text-muted mt-0.5">
          {[formatDate(stream.published_at), formatViews(stream.view_count)].filter(Boolean).join(' · ')}
        </p>
      </div>
    </a>
  );
}

export default async function LivePage() {
  const [streamStatus, pastStreams, suiteEVideos] = await Promise.all([
    getStreamStatus(),
    getPastLivestreams().catch(() => [] as PastLivestream[]),
    getSuiteEPlaylistItems().catch(() => [] as PlaylistItem[]),
  ]);

  const { live, videoId, platform, title, error } = streamStatus;
  const latestStream = pastStreams[0] ?? null;

  const offAirStartSeconds = latestStream?.duration_seconds
    ? Math.floor(latestStream.duration_seconds * 0.3)
    : 0;

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background">
        {/* ── Header ─────────────────────────────────────────── */}
        <section className="px-6 pt-16 pb-8">
          <div className="max-w-5xl mx-auto">
            <AnimateIn
              as="p"
              className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-4"
              style={{ color: '#B57048' }}
            >
              St. Pete Music
            </AnimateIn>
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <AnimateIn delay={0.05}>
                <h1
                  className="font-inter font-black uppercase leading-none text-black"
                  style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
                >
                  Watch Live
                </h1>
              </AnimateIn>
              {live && (
                <AnimateIn delay={0.1} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-inter font-bold text-sm uppercase tracking-widest text-red-600">
                    Live Now
                  </span>
                </AnimateIn>
              )}
            </div>
            <AnimateIn delay={0.1}>
              <p className="font-inter text-text-secondary text-base">
                Live from Suite E Studios · St. Petersburg, FL
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* ── Player + Donate ──────────────────────────────────── */}
        <section className="px-6 pb-12">
          <div className="max-w-5xl mx-auto">
            {live ? (
              <div className="relative">
                <LivePlayer
                  isLive={live}
                  videoId={videoId}
                  platform={platform}
                  title={title}
                  error={error}
                />
                <div className="absolute top-0 right-0 p-3 sm:p-4 z-10">
                  <DonateButton />
                </div>
              </div>
            ) : latestStream ? (
              <div>
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${latestStream.video_id}?autoplay=1&start=${offAirStartSeconds}&modestbranding=1`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={latestStream.proposed_title ?? latestStream.title ?? 'St. Pete Music Stream'}
                  />
                  <div className="absolute top-0 right-0 p-3 sm:p-4 z-10">
                    <DonateButton />
                  </div>
                </div>
                <p className="font-inter text-text-muted text-sm mt-3">
                  Not currently live — showing our most recent stream.
                </p>
              </div>
            ) : (
              <div className="border border-black p-12 text-center">
                <p className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-4" style={{ color: '#B57048' }}>
                  Off Air
                </p>
                <p className="font-inter text-text-secondary mb-8">
                  No stream is live right now. Catch us live on YouTube or Facebook.
                </p>
                <DonateButton />
              </div>
            )}
          </div>
        </section>

        {/* ── Suite E Studios Playlist ─────────────────────────── */}
        {suiteEVideos.length > 0 && (
          <section className="px-6 pb-20">
            <div className="max-w-5xl mx-auto">
              <div className="border-t border-black/10 pt-10 mb-8">
                <AnimateIn
                  as="p"
                  className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-2"
                  style={{ color: '#B57048' }}
                >
                  Suite E Studios
                </AnimateIn>
                <AnimateIn delay={0.05}>
                  <h2 className="font-inter font-black uppercase text-2xl text-black">
                    Studio Sessions
                  </h2>
                </AnimateIn>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {suiteEVideos.map((video, i) => (
                  <AnimateIn key={video.videoId} delay={i * 0.04}>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}&list=${SUITE_E_PLAYLIST_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-3 hover:opacity-90 transition-opacity"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-inter font-bold text-sm leading-snug text-black line-clamp-2">
                          {video.title}
                        </p>
                        {video.publishedAt && (
                          <p className="font-inter text-xs text-text-muted mt-0.5">
                            {formatDate(video.publishedAt)}
                          </p>
                        )}
                      </div>
                    </a>
                  </AnimateIn>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Past Streams ─────────────────────────────────────── */}
        {pastStreams.length > 0 && (
          <section className="px-6 pb-20">
            <div className="max-w-5xl mx-auto">
              <div className="border-t border-black/10 pt-10 mb-8">
                <AnimateIn
                  as="p"
                  className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-2"
                  style={{ color: '#B57048' }}
                >
                  Archive
                </AnimateIn>
                <AnimateIn delay={0.05}>
                  <h2 className="font-inter font-black uppercase text-2xl text-black">
                    Past Streams
                  </h2>
                </AnimateIn>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {pastStreams.map((stream, i) => (
                  <AnimateIn key={stream.video_id} delay={i * 0.04}>
                    <StreamCard stream={stream} />
                  </AnimateIn>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
