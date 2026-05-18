'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimateIn } from './AnimateIn';
import { pushEvent } from '@/lib/analytics';

type Platform = 'youtube' | 'facebook' | 'twitch' | 'hls' | null;

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

  const offAirTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/stream/youtube-status');
      const data = await res.json();
      setError(data.error);
      if (data.live) {
        if (offAirTimerRef.current) {
          clearTimeout(offAirTimerRef.current);
          offAirTimerRef.current = null;
        }
        setIsLive(true);
        setVideoId(data.videoId ?? null);
        setPlatform(data.platform ?? 'youtube');
      } else if (!offAirTimerRef.current) {
        // Grace period: avoid an abrupt "Off Air" flash on brief detection gaps
        offAirTimerRef.current = setTimeout(() => {
          setIsLive(false);
          offAirTimerRef.current = null;
        }, 5_000);
      }
    } catch { /* silent — next poll will retry */ }
  }, []);

  // Always poll — detects stream start when offline and stream end when live
  useEffect(() => {
    if (isLive) {
      pushEvent('live_stream_view', { video_id: videoId, platform: platform ?? 'youtube' });
    }
    const interval = setInterval(checkStatus, 60_000);
    return () => clearInterval(interval);
  }, [isLive, videoId, platform, checkStatus]);

  useEffect(() => () => {
    if (offAirTimerRef.current) clearTimeout(offAirTimerRef.current);
  }, []);

  if (!isLive || (!videoId && platform !== 'hls')) {
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

        {platform === 'facebook' ? (
          <FacebookLiveCard url={videoId ?? ''} />
        ) : (
          <div className="relative aspect-video bg-black">
            {platform === 'hls' && <HlsPlayer />}
            {platform === 'twitch' && videoId && (
              <TwitchEmbed channel={videoId} />
            )}
            {(platform === 'youtube' || !platform) && videoId && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="St. Pete Music Live Stream"
              />
            )}
          </div>
        )}

        <p className="font-inter text-text-muted text-sm mt-4">
          Live from Suite E Studios · St. Petersburg, FL
        </p>
      </div>
    </section>
  );
}

const HLS_STREAM_URL = process.env.NEXT_PUBLIC_HLS_STREAM_URL ?? 'https://hls.stpetemusic.live/live/index.m3u8';

function HlsPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari has native HLS — no library needed
      video.src = HLS_STREAM_URL;
      return;
    }

    // Chrome/Firefox: load hls.js dynamically to keep it out of the initial bundle
    let hlsInstance: { destroy: () => void } | null = null;
    void import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported() || !videoRef.current) return;
      const hls = new Hls();
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) hls.destroy();
      });
      hls.loadSource(HLS_STREAM_URL);
      hls.attachMedia(videoRef.current);
      hlsInstance = hls;
    });

    return () => {
      hlsInstance?.destroy();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      controls
      playsInline
      className="absolute inset-0 w-full h-full"
      title="St. Pete Music Live Stream"
    />
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

// Facebook embeds require third-party cookies + App Domain registration and are blocked by most
// modern browsers without that setup. A direct link is more reliable for live streams.
function FacebookLiveCard({ url }: { url: string }) {
  return (
    <div className="border border-black p-10 text-center">
      <p className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-4" style={{ color: '#B57048' }}>
        Streaming Live on Facebook
      </p>
      <p className="font-inter text-text-secondary mb-8">
        We&apos;re live on Facebook right now. Tap below to watch.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 bg-black text-white hover:opacity-80 transition-opacity"
        onClick={() => pushEvent('outbound_link_click', { link_url: url, link_text: 'Watch Live on Facebook' })}
      >
        Watch Live on Facebook →
      </a>
    </div>
  );
}
