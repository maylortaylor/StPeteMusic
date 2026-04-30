import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Shows & Events',
  description:
    'Upcoming live music, community jams, and art walks in St. Petersburg, FL — including Final Friday and Instant Noodles at Suite E Studios.',
  openGraph: {
    title: 'St. Pete Music | Shows & Events',
    description:
      'Upcoming live music, community jams, and art walks in St. Petersburg, FL — including Final Friday and Instant Noodles at Suite E Studios.',
    url: 'https://www.stpetemusic.live/events',
  },
};

const eventsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'St. Pete Music Events',
  itemListElement: [
    {
      '@type': 'MusicEvent',
      position: 1,
      name: 'Final Friday',
      description:
        'Live music showcase — doors at 7pm, three bands performing 8pm–midnight. Last Friday of every month at Suite E Studios.',
      startDate: '2026-05-29T19:00:00-04:00',
      location: {
        '@type': 'Place',
        name: 'Suite E Studios',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '615 27th St S STE E',
          addressLocality: 'St. Petersburg',
          addressRegion: 'FL',
          postalCode: '33712',
          addressCountry: 'US',
        },
      },
      organizer: {
        '@type': 'Organization',
        name: 'St. Pete Music',
        url: 'https://www.stpetemusic.live',
      },
      url: 'https://final-friday.eventbrite.com/',
    },
    {
      '@type': 'MusicEvent',
      position: 2,
      name: 'Instant Noodles',
      description:
        'Community jam session — building the band from the ground up. Doors at 6pm, jam 7–10pm. Last Wednesday of every month at Suite E Studios.',
      startDate: '2026-05-27T18:00:00-04:00',
      location: {
        '@type': 'Place',
        name: 'Suite E Studios',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '615 27th St S STE E',
          addressLocality: 'St. Petersburg',
          addressRegion: 'FL',
          postalCode: '33712',
          addressCountry: 'US',
        },
      },
      organizer: {
        '@type': 'Organization',
        name: 'St. Pete Music',
        url: 'https://www.stpetemusic.live',
      },
    },
  ],
};

export default function EventsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }} />
      <Nav />
      <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#FF8C00' }} />
            <p className="font-inter font-medium text-xs uppercase tracking-widest" style={{ color: '#FF8C00' }}>
              Calendar
            </p>
          </div>
          <h1 className="font-inter font-black text-4xl sm:text-5xl text-black mb-4">
            Shows & Events
          </h1>
          <p className="text-text-muted text-lg max-w-xl mb-12">
            Live music, community jams, and art walks in St. Petersburg, FL.
          </p>

          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-muted font-inter text-base mb-4">
              Full events calendar coming soon. In the meantime:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://final-friday.eventbrite.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-inter font-bold text-sm uppercase tracking-wide text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#FF8C00' }}
              >
                Final Friday Tickets
              </a>
              <a
                href="https://linktr.ee/stpetemusic"
                target="_blank"
                rel="noopener noreferrer"
                className="font-inter font-bold text-sm uppercase tracking-wide text-black px-6 py-3 rounded-lg border border-border hover:border-brand-burnt transition-colors"
              >
                All Links
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
