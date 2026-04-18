'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { AnimateIn } from './AnimateIn';

const cells = [
  { span: 'col-span-2 row-span-2', bg: 'linear-gradient(135deg, #1A1038, #2D1A5E, #0F183A)', label: 'Final Friday', accent: '#E7A4E7', minH: '480px', depth: 120 },
  { span: '',                       bg: 'linear-gradient(135deg, #13102A, #1A1840)',           label: 'The Crowd',  accent: '#AB91E8', minH: '228px', depth: 180 },
  { span: '',                       bg: 'linear-gradient(135deg, #0F1535, #1957A4)',           label: 'On Stage',   accent: '#1957A4', minH: '228px', depth: 240 },
  { span: 'col-span-3',             bg: 'linear-gradient(90deg, #1A1038, #0F183A, #152248)',   label: 'Suite E Studios · Warehouse Arts District', accent: '#E7A4E7', minH: '200px', depth: 80 },
];

function ParallaxCell({ cell, index }: { cell: typeof cells[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 0.5, 1], [`${cell.depth}px`, '0px', `-${cell.depth * 0.3}px`]);
  const y = useSpring(rawY, { stiffness: 55, damping: 20 });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0.8]);

  return (
    <motion.div
      ref={ref}
      className={`${cell.span} rounded-3xl overflow-hidden group cursor-pointer hover:brightness-110 transition-brightness duration-500`}
      style={{ background: cell.bg, border: '1px solid #2D2860', minHeight: cell.minH, y, opacity }}
    >
      <div className="w-full h-full flex items-end p-8" style={{ minHeight: cell.minH }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cell.accent }} />
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
    <section style={{ background: '#13102A' }} className="px-6 py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <AnimateIn as="p" className="font-oswald text-text-muted text-sm tracking-[0.5em] uppercase mb-5">
              The Vibe
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <h2
                className="font-montserrat font-black uppercase leading-none"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 7rem)',
                  background: 'linear-gradient(90deg, #FBFFFF, #E7A4E7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
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
              style={{ color: '#E7A4E7' }}
            >
              @StPeteMusic on Instagram →
            </a>
          </AnimateIn>
        </div>

        <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: 'auto auto auto' }}>
          {cells.map((cell, i) => (
            <ParallaxCell key={i} cell={cell} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
