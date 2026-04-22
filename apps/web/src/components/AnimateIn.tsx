'use client';

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type Variants,
  type MotionValue,
} from 'framer-motion';
import { useRef, type ReactNode } from 'react';

/* ─── Fly-up with scale — more dramatic than before ─── */
const flyUp: Variants = {
  hidden: { opacity: 0, y: 100, scale: 0.92 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      delay,
      opacity: { duration: 0.6, delay },
    },
  }),
};

interface AnimateInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'section' | 'a' | 'span';
}

export function AnimateIn({ children, delay = 0, className, style, as = 'div' }: AnimateInProps) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      variants={flyUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={delay}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  );
}

/* ─── Parallax background layer ─── */
interface ParallaxLayerProps {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  speed?: number; // 0 = locked, 1 = scrolls with page, negative = opposite direction
}

export function ParallaxLayer({ children, className, style, speed = -0.3 }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}%`, `${speed * 100}%`]);
  const smoothY = useSpring(y, { stiffness: 50, damping: 20 });

  return (
    <motion.div ref={ref} className={className} style={{ ...style, y: smoothY }} aria-hidden="true">
      {children}
    </motion.div>
  );
}

/* ─── Orb with parallax ─── */
interface ParallaxOrbProps {
  style?: React.CSSProperties;
  className?: string;
  speed?: number;
}

export function ParallaxOrb({ style, className, speed = 0.25 }: ParallaxOrbProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);
  const y = useSpring(rawY, { stiffness: 40, damping: 15 });

  return (
    <motion.div ref={ref} className={className} style={{ ...style, y }} aria-hidden="true" />
  );
}

/* ─── Scroll-driven progress (for hero fade-out etc.) ─── */
export function useScrollFade(speed = 0.6): {
  ref: React.RefObject<HTMLElement | null>;
  opacity: MotionValue<number>;
  contentY: MotionValue<number>;
  orbY: MotionValue<number>;
} {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const opacity = useTransform(scrollYProgress, [0, speed], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const rawOrb = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const orbY = useSpring(rawOrb, { stiffness: 35, damping: 15 });
  return { ref, opacity, contentY, orbY };
}

/* ─── Pinned-section scroll progress ─── */
// Attach outerRef to a tall section (e.g. height: 250vh).
// Inner container should be sticky + h-screen.
// Returns 0→1 progress across the full scroll travel.
export function useScrollPinned(ref: React.RefObject<HTMLElement | null>): {
  scrollYProgress: MotionValue<number>;
} {
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  return { scrollYProgress };
}

/* ─── Consistent depth-layer parallax ─── */
// Maps scrollYProgress [0→1] to a Y pixel offset with spring smoothing.
// outputRange: [startPx, endPx] — e.g. [40, -40] moves up 80px over the scroll range.
export function useParallaxLayer(
  scrollYProgress: MotionValue<number>,
  outputRange: [number, number],
  inputRange: [number, number] = [0, 1],
): MotionValue<number> {
  const raw = useTransform(scrollYProgress, inputRange, outputRange);
  return useSpring(raw, { stiffness: 45, damping: 18 });
}
