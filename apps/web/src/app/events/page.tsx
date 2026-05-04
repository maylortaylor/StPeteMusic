import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { EventsPageClient } from '@/components/events/EventsPageClient';
import { getEventsForMonths } from '@/lib/queries/events';

export const metadata: Metadata = {
  title: 'Shows & Events',
  description:
    'Upcoming live music, community jams, and musical happenings in St. Petersburg, FL.',
  openGraph: {
    title: 'St. Pete Music | Shows & Events',
    description:
      'Upcoming live music, community jams, and musical happenings in St. Petersburg, FL.',
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

function nextInstantNoodles(): string {
  const now = new Date();
  let date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  while (date.getDay() !== 3) date.setDate(date.getDate() - 1);
  if (date <= now) {
    date = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    while (date.getDay() !== 3) date.setDate(date.getDate() - 1);
  }
  return date.toISOString().split('T')[0] + 'T18:00:00-04:00';
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
      {
        '@type': 'MusicEvent',
        position: 2,
        name: 'Instant Noodles',
        description:
          'Community jam session — building the band from the ground up. Doors at 6pm, jam 7–10pm. Last Wednesday of every month at Suite E Studios.',
        startDate: nextInstantNoodles(),
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
