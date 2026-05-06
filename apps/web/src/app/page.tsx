import type { Metadata } from 'next';
import 'yet-another-react-lightbox/styles.css';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { StatsSection } from '@/components/StatsSection';
import { YouTubeGrid } from '@/components/YouTubeGrid';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { LinkTreeSection } from '@/components/LinkTreeSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { PhotoStrip, EventsTeaser, VibesSection } from '@/components/ClientSections';

export const metadata: Metadata = {
  title: 'Live Music in St. Petersburg, FL',
  description:
    'The home for live music in St. Petersburg, FL. Discover local bands, find upcoming shows, and stay connected to the Tampa Bay music scene.',
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'St. Pete Music',
  url: 'https://www.stpetemusic.live',
  description:
    'A community of music lovers in St. Petersburg, FL — discovering local artists, amplifying the scene, and bringing people together through live music.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '615 27th St S STE E',
    addressLocality: 'St. Petersburg',
    addressRegion: 'FL',
    postalCode: '33712',
    addressCountry: 'US',
  },
  sameAs: [
    'https://www.instagram.com/StPeteMusic',
    'https://www.facebook.com/StPeteFLMusic',
    'https://youtube.com/@StPeteMusic',
  ],
};

export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      {/* JSON-LD structured data — static hardcoded object, no user input */}
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Nav />
      <main>
        <Hero />

        <StatsSection />

        <PhotoStrip />

        <EventsTeaser />

        <VibesSection />

        <YouTubeGrid />

        <NewsletterSignup variant="section" />

        <ContactSection />

        <LinkTreeSection />
      </main>
      <Footer />
    </>
  );
}
