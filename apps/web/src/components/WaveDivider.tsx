'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface WaveDividerProps {
  topColor: string;
  bottomColor: string;
  flip?: boolean;
  height?: number;
}

export function WaveDivider({ topColor, bottomColor, flip = false, height = 160 }: WaveDividerProps) {
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
        {/* Back wave — slower, more gentle, lower opacity */}
        <path
          d="M0,90 C180,140 360,40 540,80 C720,120 900,30 1080,70 C1260,110 1350,60 1440,90 L1440,160 L0,160 Z"
          fill={bottomColor}
          opacity="0.4"
        />
        {/* Front wave — sharper, higher contrast */}
        <path
          d="M0,50 C200,120 400,10 600,60 C800,110 1000,0 1200,55 C1320,85 1390,30 1440,50 L1440,160 L0,160 Z"
          fill={bottomColor}
        />
        {/* Thin neon edge tracing the front wave crest */}
        <path
          d="M0,50 C200,120 400,10 600,60 C800,110 1000,0 1200,55 C1320,85 1390,30 1440,50"
          fill="none"
          stroke="#E7A4E7"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <path
          d="M0,50 C200,120 400,10 600,60 C800,110 1000,0 1200,55 C1320,85 1390,30 1440,50"
          fill="none"
          stroke="#AB91E8"
          strokeWidth="8"
          opacity="0.1"
        />
      </motion.svg>
    </div>
  );
}
