'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimateIn } from './AnimateIn';
import { pushEvent } from '@/lib/analytics';

interface LivePlayerProps {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
  error?: string;
}

export function LivePlayer({ isLive: initialLive, videoId: initialVideoId, title, error: initialError }: LivePlayerProps) {
  const [isLive, setIsLive] = useState(initialLive);
  const [videoId, setVideoId] = useState(initialVideoId);
  const [error, setError] = useState(initialError);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/stream/youtube-status');
      const data = await res.json();
      setError(data.error);
      if (data.live && data.videoId) {
        setIsLive(true);
        setVideoId(data.videoId);
      }
    } catch { /* silent — next poll will retry */ }
  }, []);

  useEffect(() => {
    if (isLive) {
      pushEvent('live_stream_view', { video_id: videoId });
      return;
    }
    // Poll every 60s when offline — YouTube Data API has a free quota of 10,000 units/day;
    // 60s interval keeps usage well within that even with many visitors.
    const interval = setInterval(checkStatus, 60_000);
    return () => clearInterval(interval);
  }, [isLive, videoId, checkStatus]);

  if (!isLive || !videoId) {
    const isQuotaError = error === 'quota_exceeded';
    const subtext = isQuotaError
      ? 'We may be live right now — check our YouTube channel directly.'
      : 'No stream is live right now. Past streams are available on Youtube.';

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
              {subtext}
            </p>
          </AnimateIn>
          <AnimateIn delay={0.3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://youtube.com/@StPeteMusic"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 border border-black text-black hover:bg-black hover:text-white transition-colors"
              onClick={() =>
                pushEvent('outbound_link_click', {
                  link_url: 'https://youtube.com/@StPeteMusic',
                  link_text: 'Watch on YouTube',
                })
              }
            >
              Watch on YouTube
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
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="St. Pete Music Live Stream"
          />
        </div>

        <p className="font-inter text-text-muted text-sm mt-4">
          Live from Suite E Studios · St. Petersburg, FL
        </p>
      </div>
    </section>
  );
}
