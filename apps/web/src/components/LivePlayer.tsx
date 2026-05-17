'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimateIn } from './AnimateIn';
import { pushEvent } from '@/lib/analytics';

type Platform = 'youtube' | 'facebook' | 'twitch' | null;

interface LivePlayerProps {
  isLive: boolean;
  videoId: string | null;
  platform: Platform;
  title: string | null;
  error?: string;
}

const FB_PAGE_URL = 'https://www.facebook.com/stpeteflmusic/';
const YT_CHANNEL_URL = 'https://youtube.com/@StPeteMusic';

export function LivePlayer({
  isLive: initialLive,
  videoId: initialVideoId,
  platform: initialPlatform,
  title,
  error: initialError,
}: LivePlayerProps) {
  const [isLive, setIsLive] = useState(initialLive);
  const [videoId, setVideoId] = useState(initialVideoId);
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [error, setError] = useState(initialError);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/stream/youtube-status');
      const data = await res.json();
      setError(data.error);
      if (data.live && data.videoId) {
        setIsLive(true);
        setVideoId(data.videoId);
        setPlatform(data.platform ?? 'youtube');
      }
    } catch { /* silent — next poll will retry */ }
  }, []);

  useEffect(() => {
    if (isLive) {
      pushEvent('live_stream_view', { video_id: videoId, platform: platform ?? 'youtube' });
      return;
    }
    // Poll every 60s when offline
    const interval = setInterval(checkStatus, 60_000);
    return () => clearInterval(interval);
  }, [isLive, videoId, platform, checkStatus]);

  if (!isLive || !videoId) {
    const isQuotaError = error === 'quota_exceeded';
    return (
      <section className="px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateIn
            as="p"
            className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-5"
            style={{ color: '#B57048' }}
          >
            Live Stream
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <h1
              className="font-inter font-black uppercase leading-none text-black mb-6"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
            >
              Off Air
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <p className="font-inter text-text-secondary text-lg mb-8">
              {isQuotaError
                ? 'We may be live right now — check us on YouTube or Facebook directly.'
                : 'No stream is live right now. Catch us live on YouTube or Facebook.'}
            </p>
          </AnimateIn>
          <AnimateIn delay={0.3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={YT_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 border border-black text-black hover:bg-black hover:text-white transition-colors"
              onClick={() => pushEvent('outbound_link_click', { link_url: YT_CHANNEL_URL, link_text: 'Watch on YouTube' })}
            >
              Watch on YouTube
            </a>
            <a
              href={FB_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 border border-black text-black hover:bg-black hover:text-white transition-colors"
              onClick={() => pushEvent('outbound_link_click', { link_url: FB_PAGE_URL, link_text: 'Watch on Facebook' })}
            >
              Watch on Facebook
            </a>
          </AnimateIn>
          {!isQuotaError && (
            <p className="font-inter text-text-muted text-sm mt-10">
              This page checks automatically — no need to refresh.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <AnimateIn
          as="p"
          className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-4"
          style={{ color: '#B57048' }}
        >
          Live Now
        </AnimateIn>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-inter font-bold text-sm uppercase tracking-widest text-red-600">
            Live
          </span>
          {title && (
            <span className="font-inter text-sm text-text-muted ml-2">{title}</span>
          )}
        </div>

        <div className="relative aspect-video bg-black">
          {platform === 'twitch' && (
            <TwitchEmbed channel={videoId} />
          )}
          {platform === 'facebook' && (
            <FacebookEmbed url={videoId} />
          )}
          {(platform === 'youtube' || !platform) && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="St. Pete Music Live Stream"
            />
          )}
        </div>

        <p className="font-inter text-text-muted text-sm mt-4">
          Live from Suite E Studios · St. Petersburg, FL
        </p>
      </div>
    </section>
  );
}

function TwitchEmbed({ channel }: { channel: string }) {
  // Twitch requires the parent domain to match the page's hostname
  const parent = typeof window !== 'undefined' ? window.location.hostname : 'stpetemusic.live';
  return (
    <iframe
      src={`https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${parent}&autoplay=true`}
      className="absolute inset-0 w-full h-full"
      allowFullScreen
      title="St. Pete Music Live on Twitch"
    />
  );
}

function FacebookEmbed({ url }: { url: string }) {
  // Uses Facebook's video plugin iframe — no JS SDK required.
  // Works for public live streams and recorded videos.
  const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=1280&autoplay=true`;
  return (
    <iframe
      src={src}
      className="absolute inset-0 w-full h-full"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
      title="St. Pete Music Live on Facebook"
    />
  );
}
