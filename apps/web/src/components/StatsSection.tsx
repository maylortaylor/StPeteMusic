'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { AnimateIn } from './AnimateIn';

const STATS = [
  { value: '100+', label: 'Shows hosted in St. Pete',    from: '#FBFFFF', to: '#E7A4E7' },
  { value: '50+',  label: 'Local artists documented',   from: '#E7A4E7', to: '#AB91E8' },
  { value: '10+',  label: 'Years in the community',     from: '#AB91E8', to: '#1957A4' },
];

export function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawBg = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const bgY = useSpring(rawBg, { stiffness: 40, damping: 18 });

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-32" style={{ background: '#13102A' }}>
      {/* Parallax orb in background */}
      <motion.div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          width: '800px',
          height: '800px',
          top: '50%',
          left: '50%',
          x: '-50%',
          marginTop: '-400px',
          y: bgY,
          background: 'radial-gradient(circle, rgba(72,62,142,0.18) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {STATS.map((stat, i) => (
          <AnimateIn key={stat.label} delay={i * 0.15} className="flex flex-col items-center text-center py-16 md:py-0 md:px-12">
            <p
              className="font-montserrat font-black leading-none mb-4"
              style={{
                fontSize: 'clamp(5rem, 8vw, 8rem)',
                background: `linear-gradient(135deg, ${stat.from}, ${stat.to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {stat.value}
            </p>
            <p className="font-open-sans text-text-secondary text-xl max-w-[12rem]">{stat.label}</p>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
