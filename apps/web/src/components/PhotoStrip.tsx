'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, type MotionValue } from 'framer-motion';
import { AnimateIn } from './AnimateIn';
import focalPoints from '@/config/focal-points.json';

function getFocalPosition(src: string): string {
  const fp = focalPoints[src as keyof typeof focalPoints];
  return fp?.objectPosition ?? '50% 30%';
}

const STRIP_PHOTOS = [
  { src: '/images/vibes/strip-1.jpg',  caption: 'Light the Wire',  accent: '#B57048' },
  { src: '/images/vibes/strip-2.jpg',  caption: 'Katara',          accent: '#488DB5' },
  { src: '/images/vibes/strip-3.jpg',  caption: 'Mouth Council',   accent: '#B57048' },
  { src: '/images/vibes/strip-4.jpg',  caption: 'Dionysus',        accent: '#d71679' },
  { src: '/images/vibes/strip-5.jpg',  caption: 'Minim',           accent: '#488DB5' },
  { src: '/images/vibes/strip-6.jpg',  caption: 'Kneedz',          accent: '#B57048' },
  { src: '/images/vibes/strip-7.jpg',  caption: 'Suite E',         accent: '#488DB5' },
  { src: '/images/vibes/strip-8.jpg',  caption: 'Community',       accent: '#d71679' },
  { src: '/images/vibes/strip-9.jpg',  caption: 'Orchestra',       accent: '#B57048' },
  { src: '/images/vibes/strip-10.jpg', caption: 'Viorica',         accent: '#488DB5' },
];

type StripPhoto = typeof STRIP_PHOTOS[0];

function StripCard({
  photo,
  index,
  scrollYProgress,
}: {
  photo: StripPhoto;
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const dir = index % 2 === 0 ? 1 : -1;
  const rawY = useTransform(scrollYProgress, [0, 1], [dir * 70, dir * -70]);
  const y = useSpring(rawY, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      className="relative flex-shrink-0 overflow-hidden cursor-pointer"
      style={{
        width: 'clamp(200px, 20vw, 320px)',
        aspectRatio: '4 / 5',
        background: '#2A2A2A',
        border: '1px solid #488DB5',
        borderRadius: '2px',
        y,
      }}
      whileHover={{ scale: 1.03, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
    >
      {!error && (
        <Image
          src={photo.src}
          alt={photo.caption}
          fill
          className={`object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: getFocalPosition(photo.src) }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}

      {/* Dark scrim for caption legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(28,28,28,0.9) 0%, rgba(28,28,28,0.1) 50%, transparent 100%)' }}
      />

      {/* Caption */}
      <div className="absolute bottom-5 left-5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: photo.accent }} />
        <p className="font-oswald text-xs tracking-widest uppercase" style={{ color: photo.accent }}>
          {photo.caption}
        </p>
      </div>
    </motion.div>
  );
}

export function PhotoStrip() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const rawX = useTransform(scrollYProgress, [0, 1], ['8%', '-72%']);
  const x = useSpring(rawX, { stiffness: 38, damping: 20 });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16"
      style={{ background: '#1C1C1C' }}
    >
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <AnimateIn as="p" className="font-oswald text-sm tracking-[0.5em] uppercase" style={{ color: '#B57048' }}>
          The Scene
        </AnimateIn>
      </div>

      <div className="overflow-hidden">
        <motion.div className="flex gap-3 pl-6 md:pl-16 pb-4" style={{ x }}>
          {STRIP_PHOTOS.map((photo, i) => (
            <StripCard
              key={photo.caption}
              photo={photo}
              index={i}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
