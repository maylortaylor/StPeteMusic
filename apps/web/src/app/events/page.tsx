import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { EventsPageClient } from '@/components/events/EventsPageClient';
import { getEventsForMonths } from '@/lib/queries/events';

export const metadata: Metadata = {
  title: 'Live Music Concerts & Shows in St. Pete, FL',
  description:
    'Browse upcoming concerts, live music shows, and community events in St. Petersburg, FL. Your go-to music calendar for the Tampa Bay area.',
  keywords: [
    'concerts St Petersburg FL',
    'live music events St Pete',
    'upcoming shows St Petersburg',
    'live music this weekend St Pete',
    'live music tonight St Petersburg',
    'music events Tampa Bay',
    'Final Friday St Pete',
    'free concerts St Petersburg FL',
    'things to do this weekend St Pete',
    'St Pete concert calendar',
    'music events this weekend Tampa Bay',
    'live music schedule St Petersburg',
  ],
  openGraph: {
    title: 'St. Pete Music | Concerts & Live Music Events',
    description:
      'Browse upcoming concerts, live music shows, and community events in St. Petersburg, FL. Your go-to music calendar for the Tampa Bay area.',
    url: 'https://www.stpetemusic.live/events',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@StPeteMusic',
    creator: '@StPeteMusic',
    images: ['https://www.stpetemusic.live/images/hero/hero-1.jpg'],
  },
};

// Calculate next Final Friday (last Friday of current or next month) for JSON-LD
function nextFinalFriday(): string {
  const now = new Date();
  let date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  while (date.getDay() !== 5) date.setDate(date.getDate() - 1);
  if (date <= now) {
    date = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    while (date.getDay() !== 5) date.setDate(date.getDate() - 1);
  }
  return date.toISOString().split('T')[0] + 'T19:00:00-04:00';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default async function EventsPage() {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1; // 1-indexed
  const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;
  const nextYear = thisMonth === 12 ? thisYear + 1 : thisYear;

  let allEvents: Awaited<ReturnType<typeof getEventsForMonths>> = [];
  try {
    allEvents = await getEventsForMonths([
      { year: thisYear, month: thisMonth },
      { year: nextYear, month: nextMonth },
    ]);
  } catch {
    // DB unavailable — render empty state gracefully
  }

  // Split events into two months for the client
  const months = [
    {
      label: `${MONTH_NAMES[thisMonth - 1]} ${thisYear}`,
      year: thisYear,
      month: thisMonth,
      events: allEvents.filter(e => {
        const d = new Date(e.start_time);
        return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
      }),
    },
    {
      label: `${MONTH_NAMES[nextMonth - 1]} ${nextYear}`,
      year: nextYear,
      month: nextMonth,
      events: allEvents.filter(e => {
        const d = new Date(e.start_time);
        return d.getFullYear() === nextYear && d.getMonth() + 1 === nextMonth;
      }),
    },
  ];

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
        startDate: nextFinalFriday(),
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
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }} />
      <Nav />
      <main className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

          {/* Header */}
          <div className="mb-4">
            <p
              className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-4"
              style={{ color: '#FF8C00' }}
            >
              Calendar
            </p>
            <h1 className="font-inter font-black text-5xl sm:text-7xl uppercase leading-none text-black mb-3">
              Shows & Events
            </h1>
            <span className="section-underline" />
          </div>

          <p className="font-inter text-text-secondary text-lg max-w-xl mt-6 mb-12">
            Live music, community jams, and art walks in St. Petersburg, FL.
          </p>

          <EventsPageClient months={months} />
        </div>
      </main>
      <Footer />
    </>
  );
}
