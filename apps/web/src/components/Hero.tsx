'use client';

import { motion } from 'framer-motion';
import { useScrollFade } from './AnimateIn';

export function Hero() {
  const { ref, opacity, contentY, orbY } = useScrollFade(0.55);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1C1040 0%, #0D0B1E 45%, #0F1A3A 100%)' }}
    >
      {/* Parallax orb — drifts upward faster than content as you scroll */}
      <motion.div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          width: '900px',
          height: '900px',
          top: '50%',
          left: '50%',
          x: '-50%',
          y: orbY,
          marginTop: '-450px',
          background: 'radial-gradient(circle, rgba(231,164,231,0.28) 0%, rgba(171,145,232,0.14) 30%, rgba(72,62,142,0.07) 55%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Second, smaller orb offset for depth */}
      <motion.div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          width: '500px',
          height: '500px',
          top: '30%',
          left: '60%',
          x: '-50%',
          y: orbY,
          background: 'radial-gradient(circle, rgba(25,87,164,0.15) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
      />

      {/* Content fades + drifts on scroll-out */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto flex flex-col items-center gap-8"
        style={{ y: contentY, opacity }}
      >
        <motion.p
          className="font-oswald text-text-muted text-sm tracking-[0.5em] uppercase"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          St. Petersburg, FL · Warehouse Arts District
        </motion.p>

        <motion.h1
          className="font-montserrat font-black uppercase leading-none"
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{
            fontSize: 'clamp(4.5rem, 18vw, 16rem)',
            letterSpacing: '-0.01em',
            background: 'linear-gradient(160deg, #FBFFFF 0%, #E7A4E7 45%, #AB91E8 80%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          StPete<br />Music
        </motion.h1>

        <motion.p
          className="font-open-sans text-text-secondary text-2xl md:text-3xl tracking-wide max-w-2xl"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
        >
          Live Music&nbsp;&nbsp;/&nbsp;&nbsp;Local Artists&nbsp;&nbsp;/&nbsp;&nbsp;Real Community
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.65 }}
        >
          <a
            href="https://final-friday.eventbrite.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-montserrat font-bold text-base uppercase tracking-widest px-10 py-4 rounded-full transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(90deg, #E7A4E7, #483E8E)' }}
          >
            See Events
          </a>
          <a
            href="https://youtube.com/@StPeteMusic"
            target="_blank"
            rel="noopener noreferrer"
            className="font-montserrat font-bold text-base uppercase tracking-widest px-10 py-4 rounded-full transition-all hover:bg-surface"
            style={{ border: '1px solid #2D2860', color: '#AB91E8' }}
          >
            Watch on YouTube
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        style={{ opacity }}
      >
        <motion.div
          className="w-px bg-gradient-to-b from-transparent via-text-muted to-transparent"
          style={{ height: '60px' }}
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
