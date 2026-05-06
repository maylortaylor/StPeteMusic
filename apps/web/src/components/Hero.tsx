'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, useTransform, useSpring } from 'framer-motion';
import { useScrollPinned } from './AnimateIn';
import { pushEvent } from '@/lib/analytics';

export function Hero() {
  const outerRef = useRef<HTMLElement>(null);
  const [posterVisible, setPosterVisible] = useState(true);
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
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center text-center px-6 bg-black">

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
            onCanPlay={() => setPosterVisible(false)}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
          {/* Poster overlay: served via _next/image so mobile gets a small optimized variant.
              Fades out once the video can play. */}
          <Image
            src="/images/hero/hero-1.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
            style={{
              transition: 'opacity 0.4s ease',
              opacity: posterVisible ? 1 : 0,
              pointerEvents: 'none',
            }}
          />
        </motion.div>

        {/* Warm orange-tinted overlay — bridges video to Suite E brand palette */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,140,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 max-w-6xl mx-auto flex flex-col items-center gap-8"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          <h1 className="sr-only">St. Pete Music — Live Music in St. Petersburg, FL</h1>

          <motion.p
            className="font-inter font-medium text-sm tracking-[0.5em] uppercase text-white/90 mt-40"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            St. Petersburg, FL - Community Driven Music
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
              sizes="(max-width: 768px) 75vw, 500px"
              className="object-contain"
              style={{ maxWidth: 'min(500px, 75vw)', height: 'auto', marginTop: '-75px', marginBottom: '-75px' }}
              priority
            />
          </motion.div>

          <motion.p
            className="font-inter text-white/80 text-2xl md:text-3xl tracking-wide max-w-2xl"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          >
            Live Music&nbsp;&nbsp;/&nbsp;&nbsp;Local Artists&nbsp;&nbsp;/&nbsp;&nbsp;Real Community
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 mt-4 mb-40"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.65 }}
          >
            <a
              href="#newsletter"
              onClick={() => pushEvent('cta_click', { cta_label: 'tune_in', cta_location: 'hero' })}
              className="text-white font-inter font-bold text-base uppercase tracking-widest px-10 py-4 bg-black hover:opacity-85 transition-opacity"
            >
              Tune In
            </a>
            <a
              href="https://youtube.com/@StPeteMusic"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                pushEvent('cta_click', { cta_label: 'watch_youtube', cta_location: 'hero' });
                pushEvent('outbound_link_click', { link_url: 'https://youtube.com/@StPeteMusic', link_text: 'Watch on YouTube' });
              }}
              className="text-white font-inter font-bold text-base uppercase tracking-widest px-10 py-4 border border-white hover:bg-white/10 transition-all"
            >
              Watch on YouTube
            </a>
            <a
              href="https://www.eventbrite.com/o/suite-e-studios-109188388681"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                pushEvent('cta_click', { cta_label: 'get_tickets', cta_location: 'hero' });
                pushEvent('outbound_link_click', { link_url: 'https://www.eventbrite.com/o/suite-e-studios-109188388681', link_text: 'Get Tickets' });
              }}
              className="text-white font-inter font-bold text-base uppercase tracking-widest px-10 py-4 bg-brand-orange hover:opacity-85 transition-opacity"
            >
              Get Tickets
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
            className="w-px"
            style={{ height: '60px', background: 'linear-gradient(to bottom, transparent, rgba(255,140,0,0.8), transparent)' }}
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
