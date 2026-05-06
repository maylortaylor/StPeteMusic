'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { AnimateIn } from './AnimateIn';
import { pushEvent } from '@/lib/analytics';

const ARTISTS = [
  { artist: 'Movie Props',    date: 'Feb 7, 2026',  accent: '#B57048', youtubeUrl: 'https://www.youtube.com/live/T_bzHYN_PE4?si=gntKfGPM1Y3Js4n8&t=1323' },
  { artist: 'Viorica',        date: 'Feb 7, 2026',  accent: '#488DB5', youtubeUrl: 'https://www.youtube.com/live/T_bzHYN_PE4?si=PsMFMgo3uTvxvO_8&t=7372' },
  { artist: 'Aliqua',         date: 'Feb 7, 2026',  accent: '#FF8C00', youtubeUrl: 'https://www.youtube.com/live/T_bzHYN_PE4?si=MK_PmsUF7eJtSrdj&t=3839' },
  { artist: 'Physical Plant', date: 'Jan 30, 2026', accent: '#B57048', youtubeUrl: 'https://youtu.be/TelVx8eCEBk?si=od7jCVzwYS6nJYVj' },
];

const PLAYLIST_ID = 'PL5gTeopOibQREpXSSqHwVaZTWv1EdUuki';
// Thumbnail from the first video in the playlist
const PLAYLIST_THUMBNAIL_VIDEO_ID = 'T_bzHYN_PE4';

function ParallaxEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 0.4, 1], ['80px', '0px', '-20px']);
  const y = useSpring(rawY, { stiffness: 55, damping: 20 });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 1], [0, 1, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 1], [0.94, 1, 1]);

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden aspect-video mb-6 relative"
      style={{ border: '1px solid #E5E5E5', y, opacity, scale }}
    >
      {isPlaying ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/videoseries?list=${PLAYLIST_ID}&autoplay=1`}
          title="StPeteMusic — Latest Videos"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : (
        <button
          type="button"
          className="w-full h-full relative group cursor-pointer border-0 p-0 bg-transparent block"
          onClick={() => setIsPlaying(true)}
          aria-label="Play StPeteMusic latest videos on YouTube"
        >
          <Image
            src={`https://i.ytimg.com/vi/${PLAYLIST_THUMBNAIL_VIDEO_ID}/maxresdefault.jpg`}
            alt="StPeteMusic latest videos"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 85vw, 1280px"
            className="object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#FF0000' }}>
              <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </motion.div>
  );
}

export function YouTubeGrid() {
  return (
    <section className="px-6 py-32 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <AnimateIn as="p" className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-5" style={{ color: '#B57048' }}>
              Latest from the scene
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <h2
                className="font-inter font-black uppercase leading-none text-black"
                style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
              >
                Live at{' '}
                <br className="sm:hidden" />
                Suite E
              </h2>
              <span className="section-underline" />
            </AnimateIn>
          </div>
          <AnimateIn delay={0.2}>
            <a
              href="https://youtube.com/@StPeteMusic"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => pushEvent('outbound_link_click', { link_url: 'https://youtube.com/@StPeteMusic', link_text: 'All Videos' })}
              className="font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 bg-black text-white hover:opacity-85 transition-opacity shrink-0"
            >
              All Videos →
            </a>
          </AnimateIn>
        </div>

        <ParallaxEmbed />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ARTISTS.map((v, i) => (
            <a
              key={v.artist}
              href={v.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                pushEvent('video_engage', { video_title: v.artist, video_url: v.youtubeUrl });
                pushEvent('outbound_link_click', { link_url: v.youtubeUrl, link_text: v.artist });
              }}
              className="block"
            >
              <AnimateIn
                delay={i * 0.1}
                className="overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 bg-white border border-border hover:border-brand-burnt h-full"
              >
                <p className="font-inter font-medium text-sm uppercase tracking-[0.3em] mb-2" style={{ color: v.accent }}>{v.date}</p>
                <p className="font-inter font-bold text-black text-xl leading-tight">{v.artist}</p>
                <p className="font-inter text-text-muted text-base mt-1">Suite E Studios</p>
                <p className="font-inter font-medium text-xs tracking-widest uppercase mt-4" style={{ color: v.accent }}>Watch →</p>
              </AnimateIn>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
