'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { AnimateIn } from './AnimateIn';
import focalPoints from '@/config/focal-points.json';

function getFocalPosition(src: string): string {
  const fp = focalPoints[src as keyof typeof focalPoints];
  return fp?.objectPosition ?? '50% 30%';
}

const cells = [
  {
    span: 'col-span-2 row-span-2',
    photoSrc: '/images/vibes/vibe-1.jpg',
    label: 'Final Friday',
    accent: '#B57048',
    minH: '480px',
    depth: 120,
  },
  {
    span: '',
    photoSrc: '/images/vibes/vibe-2.jpg',
    label: 'The Crowd',
    accent: '#488DB5',
    minH: '228px',
    depth: 180,
  },
  {
    span: '',
    photoSrc: '/images/vibes/vibe-3.jpg',
    label: 'On Stage',
    accent: '#B57048',
    minH: '420px',
    depth: 240,
  },
  {
    span: 'col-span-3',
    photoSrc: '/images/vibes/vibe-4.jpg',
    label: 'Suite E Studios · Warehouse Arts District',
    accent: '#d71679',
    minH: '380px',
    depth: 80,
  },
];

type Cell = typeof cells[0];

function ParallaxCell({ cell }: { cell: Cell }) {
  const ref = useRef<HTMLDivElement>(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 0.5, 1], [`${cell.depth}px`, '0px', `-${cell.depth * 0.3}px`]);
  const y = useSpring(rawY, { stiffness: 55, damping: 20 });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0.8]);

  return (
    <motion.div
      ref={ref}
      className={`${cell.span} overflow-hidden group cursor-pointer hover:brightness-110 transition-[filter] duration-500 relative`}
      style={{ background: '#2A2A2A', border: '1px solid #488DB5', borderRadius: '2px', minHeight: cell.minH, y, opacity }}
    >
      {!photoError && (
        <Image
          src={cell.photoSrc}
          alt={cell.label}
          fill
          className={`object-cover transition-opacity duration-700 ${photoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: getFocalPosition(cell.photoSrc) }}
          onLoad={() => setPhotoLoaded(true)}
          onError={() => setPhotoError(true)}
        />
      )}

      {/* Grain + dark scrim overlay */}
      <div
        className="absolute inset-0 pointer-events-none photo-noise"
        style={{
          background: 'linear-gradient(to top, rgba(28,28,28,0.88) 0%, rgba(28,28,28,0.2) 45%, rgba(28,28,28,0.05) 100%)',
        }}
      />

      {/* Label */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end p-8"
        style={{ minHeight: cell.minH }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: cell.accent }} />
          <p className="font-oswald text-sm tracking-widest uppercase" style={{ color: cell.accent }}>
            {cell.label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function VibesSection() {
  return (
    <section style={{ background: '#545454' }} className="px-6 py-32 overflow-hidden grain">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <AnimateIn as="p" className="font-oswald text-sm tracking-[0.5em] uppercase mb-5" style={{ color: '#B57048' }}>
              The Vibe
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <h2
                className="font-montserrat font-black uppercase leading-none text-text-primary"
                style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
              >
                Real Shows.<br />Real People.
              </h2>
            </AnimateIn>
          </div>
          <AnimateIn delay={0.2}>
            <a
              href="https://www.instagram.com/StPeteMusic"
              target="_blank"
              rel="noopener noreferrer"
              className="font-oswald text-base tracking-[0.35em] uppercase transition-opacity hover:opacity-70 shrink-0"
              style={{ color: '#B57048' }}
            >
              @StPeteMusic on Instagram →
            </a>
          </AnimateIn>
        </div>

        <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: 'auto auto auto' }}>
          {cells.map((cell, i) => (
            <ParallaxCell key={i} cell={cell} />
          ))}
        </div>
      </div>
    </section>
  );
}
