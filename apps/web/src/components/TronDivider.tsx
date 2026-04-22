'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface TronDividerProps {
  topColor: string;
  bottomColor: string;
  flip?: boolean;
  height?: number;
}

// Back layer — wider peaks, softer rhythm, like a distant skyline
const BACK_PEAKS =
  'M0,160 L0,100 L80,55 L160,105 L280,30 L400,95 L520,40 L640,110 L760,25 L880,90 L1000,45 L1120,105 L1240,35 L1360,90 L1440,115 L1440,160 Z';

// Front layer — sharper peaks, more varied heights, closer range
const FRONT_PEAKS =
  'M0,160 L0,120 L60,48 L140,128 L260,12 L360,108 L460,38 L580,118 L700,8 L820,102 L940,32 L1060,112 L1180,22 L1300,98 L1400,52 L1440,78 L1440,160 Z';

// Just the crest of the front layer — used for the neon stroke + pulse dot
const FRONT_EDGE =
  'M0,120 L60,48 L140,128 L260,12 L360,108 L460,38 L580,118 L700,8 L820,102 L940,32 L1060,112 L1180,22 L1300,98 L1400,52 L1440,78';

export function TronDivider({ topColor, bottomColor, flip = false, height = 160 }: TronDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const y = useSpring(rawY, { stiffness: 50, damping: 20 });

  return (
    <div
      ref={ref}
      className="w-full overflow-hidden leading-none relative"
      style={{ backgroundColor: topColor }}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 1440 160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full block"
        style={{
          height: `${height}px`,
          transform: flip ? 'scaleX(-1)' : undefined,
          y,
        }}
      >
        {/* Back peaks — distant skyline, lower opacity */}
        <path d={BACK_PEAKS} fill={bottomColor} opacity="0.4" />

        {/* Front peaks — sharp foreground range */}
        <path d={FRONT_PEAKS} fill={bottomColor} />

        {/* Broad glow behind the neon crest */}
        <path d={FRONT_EDGE} fill="none" stroke="#AB91E8" strokeWidth="10" opacity="0.1" />

        {/* Neon crest line */}
        <path d={FRONT_EDGE} fill="none" stroke="#E7A4E7" strokeWidth="1.5" opacity="0.55" />

        {/* Pulse dot — travels the crest left to right */}
        <motion.circle
          r="2.5"
          fill="#FBFFFF"
          opacity="0.9"
          animate={{ offsetDistance: ['0%', '100%'] }}
          style={{ offsetPath: `path("${FRONT_EDGE}")` } as React.CSSProperties}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />

        {/* Second dot — travels right to left, offset start, subtler */}
        <motion.circle
          r="1.5"
          fill="#E7A4E7"
          opacity="0.5"
          animate={{ offsetDistance: ['100%', '0%'] }}
          style={{ offsetPath: `path("${FRONT_EDGE}")` } as React.CSSProperties}
          transition={{ duration: 11, repeat: Infinity, ease: 'linear', delay: 3 }}
        />
      </motion.svg>
    </div>
  );
}
