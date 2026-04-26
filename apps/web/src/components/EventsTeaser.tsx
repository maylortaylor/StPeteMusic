'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Link from 'next/link';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { LightboxImage } from './LightboxImage';
import { AnimateIn } from './AnimateIn';
import focalPoints from '@/config/focal-points.json';

function getFocalPosition(src: string, fallback?: string): string {
  const fp = focalPoints[src as keyof typeof focalPoints];
  return fp?.objectPosition ?? fallback ?? '50% 30%';
}

interface Event {
  label: string;
  title: string;
  body: string;
  date: string;
  venue: string;
  ticketUrl?: string;
  presenter?: { name: string; links: { label: string; href: string }[] };
  photoSrc: string;
  photoPosition?: string;
  logoSrc?: string;
}

const EVENTS: Event[] = [
  {
    label: 'Monthly · Last Friday',
    title: 'Final Friday.',
    body: 'Three bands. One night. Suite E Studios. The signature St. Pete music event — live, loud, and local every last Friday of the month.',
    date: 'April 25, 2026',
    venue: 'Suite E Studios · Doors 7pm',
    ticketUrl: 'https://final-friday.eventbrite.com/',
    photoSrc: '/images/events/final-friday/hero.jpg',
    photoPosition: '65% bottom',
    logoSrc: '/images/brand/ff-logo-magenta.png',
  },
  {
    label: 'Monthly · 4th Wednesday · Prophessor J Events',
    title: 'Final Wednesday.',
    body: 'Community jam night & listening lounge — live instruments, local artists, and great vibes. $5 entry includes a raffle for free studio time. Guitar, drums, bass, piano, mics, and full recording gear provided.',
    date: 'April 23, 2026',
    venue: 'Suite E Studios · 615 27th St S, St. Pete · 7–10pm',
    presenter: {
      name: 'Prophessor J Events',
      links: [
        { label: 'FB Community', href: 'https://www.facebook.com/groups/803946243670033' },
        { label: 'FB Page', href: 'https://www.facebook.com/profile.php?id=100090049310435' },
      ],
    },
    photoSrc: '/images/vibes/strip-10.jpg',
    photoPosition: '15% bottom',
  },
];

function EventRow({ event, index, onOpenPhoto }: { event: Event; index: number; onOpenPhoto: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const rawText = useTransform(scrollYProgress, [0, 0.4, 1], [index % 2 === 0 ? '-8%' : '8%', '0%', '0%']);
  const textX = useSpring(rawText, { stiffness: 60, damping: 22 });

  const rawVis = useTransform(scrollYProgress, [0, 0.4, 1], [index % 2 === 0 ? '8%' : '-8%', '0%', '0%']);
  const visX = useSpring(rawVis, { stiffness: 60, damping: 22 });

  const rawPhotoY = useTransform(scrollYProgress, [0, 1], ['6%', '-6%']);
  const photoY = useSpring(rawPhotoY, { stiffness: 50, damping: 20 });

  const scale = useTransform(scrollYProgress, [0, 0.3], [0.95, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.85, 1], [0, 1, 1, 1]);

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${index % 2 === 0 ? '' : 'lg:[direction:rtl]'}`}
    >
      {/* Text side */}
      <motion.div
        className="flex flex-col justify-center px-12 py-16 lg:[direction:ltr]"
        style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', x: textX, opacity, scale, containerType: 'inline-size' }}
      >
        <p className="font-inter font-medium text-sm tracking-[0.45em] uppercase mb-5" style={{ color: '#B57048' }}>
          {event.label}
        </p>
        <h3
          className="font-inter font-black uppercase leading-none mb-3 text-black"
          style={{ fontSize: 'clamp(2rem, 9cqi, 5rem)' }}
        >
          {event.title}
        </h3>
        <span className="section-underline mb-6" />
        <p className="font-inter text-text-secondary text-xl leading-relaxed mb-8 max-w-md">
          {event.body}
        </p>
        <p className="font-inter text-text-muted text-base mb-1">{event.date}</p>
        <p className="font-inter text-text-muted text-base mb-8">{event.venue}</p>
        {event.ticketUrl ? (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-white font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 hover:opacity-85 transition-opacity bg-black"
          >
            Get Tickets
          </a>
        ) : (
          <span className="font-inter font-medium text-text-muted text-base uppercase tracking-widest">$5 at the door · No reservation needed</span>
        )}

        {event.presenter && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="font-inter font-medium text-xs tracking-[0.3em] uppercase mb-2 text-text-muted">
              Presented by {event.presenter.name}
            </p>
            <div className="flex gap-4">
              {event.presenter.links.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-inter text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Visual side — large photo */}
      <motion.div
        className="min-h-[400px] lg:min-h-[560px] lg:[direction:ltr] overflow-hidden relative cursor-zoom-in"
        onClick={onOpenPhoto}
        style={{ background: '#F5F0EB', border: '1px solid #E5E5E5', x: visX, opacity, scale }}
      >
        {!photoError && (
          <motion.div className="absolute inset-0" style={{ y: photoY, scale: 1.12 }}>
            <LightboxImage
              src={event.photoSrc}
              alt={event.title}
              fill
              className={`object-cover transition-opacity duration-700 pointer-events-none ${photoLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ objectPosition: getFocalPosition(event.photoSrc, event.photoPosition) }}
              onLoad={() => setPhotoLoaded(true)}
              onError={() => setPhotoError(true)}
            />
          </motion.div>
        )}

        {/* Light scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)' }}
        />

        {event.logoSrc && (
          <div className="absolute bottom-5 right-5 pointer-events-none">
            <Image
              src={event.logoSrc}
              alt={event.title}
              width={96}
              height={96}
              className="object-contain opacity-80"
              style={{ width: 80, height: 'auto' }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function EventsTeaser() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const slides = EVENTS.map(event => ({ src: event.photoSrc, alt: event.title }));

  return (
    <section className="px-6 py-32 bg-surface">
      <div className="max-w-7xl mx-auto">

        <div className="mb-20">
          <AnimateIn as="p" className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-4" style={{ color: '#B57048' }}>
            Upcoming
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <h2
              className="font-inter font-black uppercase leading-none text-black"
              style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
            >
              Shows &amp; Events
            </h2>
            <span className="section-underline" />
          </AnimateIn>
        </div>

        <div className="flex flex-col gap-4">
          {EVENTS.map((event, i) => (
            <EventRow
              key={event.title}
              event={event}
              index={i}
              onOpenPhoto={() => {
                setLightboxIndex(i);
                setLightboxOpen(true);
              }}
            />
          ))}
        </div>

        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={slides}
          plugins={[Zoom]}
        />

        <AnimateIn delay={0.1} className="mt-12 text-center">
          <Link href="/events" className="font-inter font-medium text-text-muted hover:text-text-secondary text-base tracking-[0.3em] uppercase transition-colors">
            View Full Calendar →
          </Link>
        </AnimateIn>
      </div>
    </section>
  );
}
