'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface SlashDividerProps {
  topColor: string;
  bottomColor: string;
  flip?: boolean;
  height?: number;
}

export function SlashDivider({ topColor, bottomColor, flip = false, height = 120 }: SlashDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const y = useSpring(rawY, { stiffness: 50, damping: 20 });

  // Three overlapping slash cuts at slightly different angles for depth
  const slash1 = 'M0,80 L1440,20 L1440,120 L0,120 Z';
  const slash2 = 'M0,100 L1440,40 L1440,120 L0,120 Z';
  const edge1  = 'M0,80 L1440,20';
  const edge2  = 'M0,100 L1440,40';

  return (
    <div
      ref={ref}
      className="w-full overflow-hidden leading-none"
      style={{
        backgroundColor: topColor,
        transform: flip ? 'scaleY(-1)' : undefined,
      }}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 1440 120"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: `${height}px`, y }}
      >
        {/* Back slash — wider angle, softer */}
        <path d={slash2} fill={bottomColor} opacity="0.35" />

        {/* Front slash — main cut */}
        <path d={slash1} fill={bottomColor} />

        {/* Soft glow on back edge */}
        <path d={edge2} fill="none" stroke="#483E8E" strokeWidth="10" opacity="0.15" />
        <path d={edge2} fill="none" stroke="#AB91E8" strokeWidth="2" opacity="0.3" />

        {/* Hard neon cut on front edge */}
        <path d={edge1} fill="none" stroke="#AB91E8" strokeWidth="8" opacity="0.12" />
        <path d={edge1} fill="none" stroke="#E7A4E7" strokeWidth="2" opacity="0.6" />
        <path d={edge1} fill="none" stroke="#FBFFFF" strokeWidth="0.75" opacity="0.9" />

        {/* Glint: short bright segment that sweeps across */}
        <motion.line
          x1="0" y1="80" x2="80" y2="76"
          stroke="white"
          strokeWidth="2"
          opacity="0.7"
          animate={{ x: [0, 1360], opacity: [0, 0.8, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  );
}
