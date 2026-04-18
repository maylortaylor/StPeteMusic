'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Link from 'next/link';
import { AnimateIn } from './AnimateIn';

interface Event {
  label: string;
  title: string;
  body: string;
  date: string;
  venue: string;
  ticketUrl?: string;
  accentFrom: string;
  accentTo: string;
  visualBg: string;
}

const EVENTS: Event[] = [
  {
    label: 'Monthly · Last Friday',
    title: 'Final Friday.',
    body: 'Three bands. One night. Suite E Studios. The signature St. Pete music event — live, loud, and local every last Friday of the month.',
    date: 'April 25, 2026',
    venue: 'Suite E Studios · Doors 7pm',
    ticketUrl: 'https://final-friday.eventbrite.com/',
    accentFrom: '#E7A4E7',
    accentTo: '#AB91E8',
    visualBg: 'linear-gradient(135deg, #1A1038 0%, #2D1A5E 50%, #1957A4 100%)',
  },
  {
    label: 'Monthly · Last Wednesday',
    title: 'Instant Noodles.',
    body: "St. Pete's community jam — building the band from the ground up, every last Wednesday. Free to attend. Open to all.",
    date: 'April 29, 2026',
    venue: 'Suite E Studios · Doors 6pm',
    accentFrom: '#AB91E8',
    accentTo: '#483E8E',
    visualBg: 'linear-gradient(135deg, #0F183A 0%, #1A1840 50%, #2D2860 100%)',
  },
];

function EventRow({ event, index }: { event: Event; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  // Text card slides in from left/right
  const rawText = useTransform(scrollYProgress, [0, 0.4, 1], [index % 2 === 0 ? '-8%' : '8%', '0%', '0%']);
  const textX = useSpring(rawText, { stiffness: 60, damping: 22 });

  // Visual panel slides in from the opposite side
  const rawVis = useTransform(scrollYProgress, [0, 0.4, 1], [index % 2 === 0 ? '8%' : '-8%', '0%', '0%']);
  const visX = useSpring(rawVis, { stiffness: 60, damping: 22 });

  // Shared opacity
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.85, 1], [0, 1, 1, 1]);

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${index % 2 === 0 ? '' : 'lg:[direction:rtl]'}`}
    >
      {/* Text side */}
      <motion.div
        className="flex flex-col justify-center px-12 py-16 rounded-3xl lg:[direction:ltr]"
        style={{ background: '#13102A', border: '1px solid #2D2860', x: textX, opacity }}
      >
        <p className="font-oswald text-sm tracking-[0.45em] uppercase mb-5" style={{ color: event.accentFrom }}>
          {event.label}
        </p>
        <h3
          className="font-montserrat font-black uppercase leading-none mb-6"
          style={{
            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
            background: `linear-gradient(135deg, ${event.accentFrom}, ${event.accentTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {event.title}
        </h3>
        <p className="font-open-sans text-text-secondary text-xl leading-relaxed mb-8 max-w-md">
          {event.body}
        </p>
        <p className="font-open-sans text-text-muted text-base mb-1">{event.date}</p>
        <p className="font-open-sans text-text-muted text-base mb-8">{event.venue}</p>
        {event.ticketUrl ? (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-white font-montserrat font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-full hover:opacity-85 transition-opacity"
            style={{ background: `linear-gradient(90deg, ${event.accentFrom}, ${event.accentTo})` }}
          >
            Get Tickets
          </a>
        ) : (
          <span className="font-oswald text-text-muted text-base uppercase tracking-widest">Free · No tickets needed</span>
        )}
      </motion.div>

      {/* Visual side */}
      <motion.div
        className="rounded-3xl min-h-[400px] lg:[direction:ltr]"
        style={{ background: event.visualBg, border: '1px solid #2D2860', x: visX, opacity }}
      />
    </div>
  );
}

export function EventsTeaser() {
  return (
    <section style={{ background: '#0D0B1E' }} className="px-6 py-32">
      <div className="max-w-7xl mx-auto">

        <div className="mb-20">
          <AnimateIn as="p" className="font-oswald text-text-muted text-sm tracking-[0.5em] uppercase mb-4">
            Upcoming
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <h2
              className="font-montserrat font-black uppercase leading-none"
              style={{
                fontSize: 'clamp(3rem, 8vw, 7rem)',
                background: 'linear-gradient(90deg, #FBFFFF, #AB91E8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Shows &amp; Events
            </h2>
          </AnimateIn>
        </div>

        <div className="flex flex-col gap-4">
          {EVENTS.map((event, i) => (
            <EventRow key={event.title} event={event} index={i} />
          ))}
        </div>

        <AnimateIn delay={0.1} className="mt-12 text-center">
          <Link href="/events" className="font-oswald text-text-muted hover:text-text-secondary text-base tracking-[0.3em] uppercase transition-colors">
            View Full Calendar →
          </Link>
        </AnimateIn>
      </div>
    </section>
  );
}
