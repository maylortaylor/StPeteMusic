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
    "St. Pete's home for live music — discover local bands, upcoming concerts, music venues, and nightlife in St. Petersburg, FL and the Tampa Bay area.",
  keywords: [
    'live music St Pete',
    'things to do in St Petersburg FL',
    'St Pete nightlife',
    'live music tonight St Petersburg',
    'live music this weekend St Pete',
    'music venues St Petersburg FL',
    'bars with live music St Pete',
    'concerts St Petersburg FL',
    'St Pete bands',
    'Tampa Bay music scene',
    'St Petersburg FL entertainment',
    'things to do in St Pete tonight',
    'best live music in St Petersburg Florida',
    'what to do in St Pete tonight',
  ],
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
    'https://www.tiktok.com/@stpetemusic',
    'https://www.eventbrite.com/o/suite-e-studios-109188388681',
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
