'use client';

import dynamicImport from 'next/dynamic';
import 'yet-another-react-lightbox/styles.css';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { StatsSection } from '@/components/StatsSection';
import { YouTubeGrid } from '@/components/YouTubeGrid';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

const PhotoStrip = dynamicImport(() => import('@/components/PhotoStrip').then(m => m.PhotoStrip), {
  ssr: false,
});
const VibesSection = dynamicImport(() => import('@/components/VibesSection').then(m => m.VibesSection), {
  ssr: false,
});
const EventsTeaser = dynamicImport(() => import('@/components/EventsTeaser').then(m => m.EventsTeaser), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />

        <StatsSection />

        <PhotoStrip />

        <EventsTeaser />

        <VibesSection />

        <YouTubeGrid />

        <NewsletterSignup variant="section" />
      </main>
      <Footer />
    </>
  );
}
