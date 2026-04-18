'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { AnimateIn } from './AnimateIn';

const ARTISTS = [
  { artist: 'Movie Props',    date: 'Feb 7, 2026',  accent: '#E7A4E7', bg: 'linear-gradient(135deg,#1A1038,#1D1550)' },
  { artist: 'Viorica',        date: 'Feb 7, 2026',  accent: '#AB91E8', bg: 'linear-gradient(135deg,#13102A,#1A1840)' },
  { artist: 'Aliqua',         date: 'Feb 7, 2026',  accent: '#1957A4', bg: 'linear-gradient(135deg,#0F1535,#152248)' },
  { artist: 'Physical Plant', date: 'Jan 30, 2026', accent: '#483E8E', bg: 'linear-gradient(135deg,#1A1840,#1D1550)' },
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
      className="rounded-3xl overflow-hidden aspect-video mb-6"
      style={{ border: '1px solid #2D2860', y, opacity, scale }}
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
    <section style={{ background: '#0D0B1E' }} className="px-6 py-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <AnimateIn as="p" className="font-oswald text-text-muted text-sm tracking-[0.5em] uppercase mb-5">
              Latest from the scene
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <h2
                className="font-montserrat font-black uppercase leading-none"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 7rem)',
                  background: 'linear-gradient(90deg, #FBFFFF, #AB91E8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Live at Suite E
              </h2>
            </AnimateIn>
          </div>
          <AnimateIn delay={0.2}>
            <a
              href="https://youtube.com/@StPeteMusic"
              target="_blank"
              rel="noopener noreferrer"
              className="font-oswald text-text-muted hover:text-text-secondary text-base tracking-[0.3em] uppercase transition-colors shrink-0"
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
              className="rounded-2xl overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1"
              style={{ background: v.bg, border: '1px solid #2D2860' }}
            >
              <p className="font-oswald text-sm uppercase tracking-[0.3em] mb-2" style={{ color: v.accent }}>{v.date}</p>
              <p className="font-montserrat font-bold text-text-primary text-xl leading-tight">{v.artist}</p>
              <p className="font-open-sans text-text-muted text-base mt-1">Suite E Studios</p>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
