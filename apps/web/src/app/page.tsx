import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { StatsSection } from '@/components/StatsSection';
import { EventsTeaser } from '@/components/EventsTeaser';
import { VibesSection } from '@/components/VibesSection';
import { YouTubeGrid } from '@/components/YouTubeGrid';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { Footer } from '@/components/Footer';
import { WaveDivider } from '@/components/WaveDivider';
import { TronDivider } from '@/components/TronDivider';
import { SlashDivider } from '@/components/SlashDivider';

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />

        {/* Jagged cut drops into stats */}
        <TronDivider topColor="#0D0B1E" bottomColor="#13102A" />

        <StatsSection />

        {/* Smooth wave out of stats */}
        <WaveDivider topColor="#13102A" bottomColor="#0D0B1E" />

        <EventsTeaser />

        {/* Sharp diagonal slash into vibes */}
        <SlashDivider topColor="#0D0B1E" bottomColor="#13102A" />

        <VibesSection />

        {/* Flipped wave — crests point down */}
        <WaveDivider topColor="#13102A" bottomColor="#0D0B1E" flip />

        <YouTubeGrid />

        {/* Flipped tron — jagged peaks point up from below */}
        <TronDivider topColor="#0D0B1E" bottomColor="#13102A" flip />

        <NewsletterSignup variant="section" />

        {/* Final diagonal into footer */}
        <SlashDivider topColor="#13102A" bottomColor="#0A0818" flip />
      </main>
      <Footer />
    </>
  );
}
