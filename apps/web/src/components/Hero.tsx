'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useTransform, useSpring } from 'framer-motion';
import { useScrollPinned } from './AnimateIn';

export function Hero() {
  const outerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScrollPinned(outerRef);

  // Video container scales slightly and drifts up on scroll — cinematic depth
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const rawVideoY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const videoY = useSpring(rawVideoY, { stiffness: 40, damping: 18 });

  // Content drifts up and fades out as user scrolls away
  const rawContentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentY = useSpring(rawContentY, { stiffness: 40, damping: 18 });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45, 0.8], [1, 1, 0]);

  // Scroll cue fades early
  const scrollCueOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <section
      ref={outerRef}
      style={{ height: '160vh' }}
      className="relative"
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center text-center px-6 bg-background">

        {/* Video loop — cinematic hero background */}
        <motion.div
          className="absolute inset-0"
          style={{ scale: videoScale, y: videoY }}
          aria-hidden="true"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
            {/* Fallback image if video fails */}
            <Image
              src="/images/hero/hero-1.jpg"
              alt="Live music at Suite E Studios"
              fill
              className="object-cover object-center"
              priority
            />
          </video>
        </motion.div>

        {/* Dark overlay — ensures legibility, adds gritty depth */}
        <div
          className="absolute inset-0 pointer-events-none grain"
          aria-hidden="true"
          style={{
            background: 'linear-gradient(to bottom, rgba(28,28,28,0.6) 0%, rgba(28,28,28,0.25) 40%, rgba(28,28,28,0.75) 100%)',
          }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 max-w-6xl mx-auto flex flex-col items-center gap-8"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          <motion.p
            className="font-oswald text-sm tracking-[0.5em] uppercase"
            style={{ color: '#B57048' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            St. Petersburg, FL · Warehouse Arts District
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <Image
              src="/images/brand/spm-logo-palm.png"
              alt="St Pete Music"
              width={500}
              height={500}
              className="object-contain"
              style={{ maxWidth: 'min(500px, 75vw)', height: 'auto' }}
              priority
            />
          </motion.div>

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
              className="text-white font-montserrat font-bold text-base uppercase tracking-widest px-10 py-4 rounded-sm transition-opacity hover:opacity-85"
              style={{ background: '#B57048' }}
            >
              See Events
            </a>
            <a
              href="https://youtube.com/@StPeteMusic"
              target="_blank"
              rel="noopener noreferrer"
              className="font-montserrat font-bold text-base uppercase tracking-widest px-10 py-4 rounded-sm transition-all hover:bg-white/10"
              style={{ border: '1px solid #488DB5', color: '#488DB5' }}
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
          style={{ opacity: scrollCueOpacity }}
        >
          <motion.div
            className="w-px bg-gradient-to-b from-transparent via-text-muted to-transparent"
            style={{ height: '60px' }}
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
