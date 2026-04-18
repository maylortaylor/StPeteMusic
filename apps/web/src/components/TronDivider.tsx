'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface TronDividerProps {
  topColor: string;
  bottomColor: string;
  flip?: boolean;
  height?: number;
}

export function TronDivider({ topColor, bottomColor, flip = false, height = 140 }: TronDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 1], [-25, 25]);
  const y = useSpring(rawY, { stiffness: 50, damping: 20 });

  // More extreme peaks — full 0–130px range
  const points: [number, number][] = [
    [0, 140], [0, 95],
    [50, 95],  [110, 18],  [200, 75],
    [280, 5],  [370, 60],
    [450, 100],[520, 25],  [610, 80],
    [680, 10], [760, 65],
    [840, 110],[920, 20],  [1000, 70],
    [1080, 5], [1160, 55],
    [1240, 95],[1310, 30], [1380, 75],
    [1440, 45],[1440, 140],
  ];

  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';
  const edgePoints = points.slice(1, points.length - 1);
  const strokeD = edgePoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

  return (
    <div
      ref={ref}
      className="w-full overflow-hidden leading-none"
      style={{
        backgroundColor: topColor,
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 1440 140"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: `${height}px`, y }}
      >
        {/* Shadow fill behind the jagged edge for depth */}
        <path
          d={points.map(([x, py], i) => `${i === 0 ? 'M' : 'L'}${x},${Math.min(py + 12, 140)}`).join(' ') + ' Z'}
          fill={bottomColor}
          opacity="0.35"
        />

        {/* Main jagged fill */}
        <path d={d} fill={bottomColor} />

        {/* Broad glow behind the neon line */}
        <path d={strokeD} fill="none" stroke="#AB91E8" strokeWidth="12" opacity="0.08" />

        {/* Mid glow */}
        <path d={strokeD} fill="none" stroke="#E7A4E7" strokeWidth="4" opacity="0.2" />

        {/* Sharp neon edge */}
        <path d={strokeD} fill="none" stroke="#E7A4E7" strokeWidth="1.5" opacity="0.85" />

        {/* Animated pulse dot travelling the edge */}
        <motion.circle
          r="3"
          fill="#FBFFFF"
          opacity="0.9"
          animate={{
            offsetDistance: ['0%', '100%'],
          }}
          style={{ offsetPath: `path("${strokeD}")` } as React.CSSProperties}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      </motion.svg>
    </div>
  );
}
