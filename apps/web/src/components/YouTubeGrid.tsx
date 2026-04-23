'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { AnimateIn } from './AnimateIn';

const ARTISTS = [
  { artist: 'Movie Props',    date: 'Feb 7, 2026',  accent: '#B57048' },
  { artist: 'Viorica',        date: 'Feb 7, 2026',  accent: '#488DB5' },
  { artist: 'Aliqua',         date: 'Feb 7, 2026',  accent: '#FF8C00' },
  { artist: 'Physical Plant', date: 'Jan 30, 2026', accent: '#B57048' },
];

const PLAYLIST_ID = 'PL5gTeopOibQREpXSSqHwVaZTWv1EdUuki';

function ParallaxEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 0.4, 1], ['80px', '0px', '-20px']);
  const y = useSpring(rawY, { stiffness: 55, damping: 20 });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 1], [0, 1, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 1], [0.94, 1, 1]);

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden aspect-video mb-6"
      style={{ border: '1px solid #E5E5E5', y, opacity, scale }}
    >
      <iframe
        src={`https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&autoplay=0`}
        title="StPeteMusic — Latest Videos"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
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
                Live at Suite E
              </h2>
              <span className="section-underline" />
            </AnimateIn>
          </div>
          <AnimateIn delay={0.2}>
            <a
              href="https://youtube.com/@StPeteMusic"
              target="_blank"
              rel="noopener noreferrer"
              className="font-inter font-medium text-text-muted hover:text-text-secondary text-base tracking-[0.3em] uppercase transition-colors shrink-0"
            >
              All Videos →
            </a>
          </AnimateIn>
        </div>

        <ParallaxEmbed />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ARTISTS.map((v, i) => (
            <AnimateIn
              key={v.artist}
              delay={i * 0.1}
              className="overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 bg-white border border-border hover:border-brand-burnt"
            >
              <p className="font-inter font-medium text-sm uppercase tracking-[0.3em] mb-2" style={{ color: v.accent }}>{v.date}</p>
              <p className="font-inter font-bold text-black text-xl leading-tight">{v.artist}</p>
              <p className="font-inter text-text-muted text-base mt-1">Suite E Studios</p>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
