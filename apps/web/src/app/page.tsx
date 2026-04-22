import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { StatsSection } from '@/components/StatsSection';
import { PhotoStrip } from '@/components/PhotoStrip';
import { EventsTeaser } from '@/components/EventsTeaser';
import { VibesSection } from '@/components/VibesSection';
import { YouTubeGrid } from '@/components/YouTubeGrid';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { Footer } from '@/components/Footer';
import { SlashDivider } from '@/components/SlashDivider';

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />

        <StatsSection />

        <PhotoStrip />

        <SlashDivider topColor="#1C1C1C" bottomColor="#1C1C1C" />

        <EventsTeaser />

        <VibesSection />

        <YouTubeGrid />

        <SlashDivider topColor="#3A3A3A" bottomColor="#3A3A3A" flip />

        <NewsletterSignup variant="section" />
      </main>
      <Footer />
    </>
  );
}
