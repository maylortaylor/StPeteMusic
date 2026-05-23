import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { EventbriteCard } from '@/components/EventbriteCard';
import { getActiveEventbriteEvents } from '@/lib/queries/eventbrite';

export const metadata: Metadata = {
  title: 'Tickets | St. Pete Music',
  description:
    'Get tickets to upcoming live music events and shows in St. Petersburg, FL. Presented by StPeteMusic at Suite E Studios and beyond.',
  alternates: {
    canonical: 'https://www.stpetemusic.live/tickets',
  },
  openGraph: {
    title: 'Tickets | St. Pete Music',
    description:
      'Get tickets to upcoming live music events in St. Pete, FL.',
    url: 'https://www.stpetemusic.live/tickets',
    images: [{ url: '/images/og/tickets-bg2.png', width: 1200, height: 630, alt: 'Get Tickets — St. Pete Music' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@StPeteMusic',
    creator: '@StPeteMusic',
    images: ['https://www.stpetemusic.live/images/og/tickets-bg2.png'],
  },
};

export default async function TicketsPage() {
  const events = await getActiveEventbriteEvents();

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-500 mb-2">
              Tickets
            </p>
            <h1 className="text-4xl font-bold text-foreground">
              Get Your Tickets
            </h1>
            <div className="mt-2 h-1 w-16 bg-orange-400 rounded-full" />
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Upcoming ticketed events in St. Pete. Presented by StPeteMusic at Suite E Studios and
              beyond.
            </p>

            {/* Eventbrite attribution */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 max-w-2xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {/* Eventbrite wordmark color */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f05537" className="w-5 h-5 shrink-0" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
                <span>
                  Events are powered by{' '}
                  <span className="font-semibold text-foreground">Eventbrite</span>
                  {' '}— browse and purchase tickets directly on our Eventbrite page.
                </span>
              </div>
              <a
                href="https://www.eventbrite.com/o/suite-e-studios-109188388681"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-[#f05537] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d94a2e] transition-colors whitespace-nowrap"
              >
                View All on Eventbrite →
              </a>
            </div>
          </div>

          {/* Events grid */}
          {events.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-20 text-center">
              <p className="text-xl font-semibold text-muted-foreground">No upcoming ticketed events</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon or follow{' '}
                <a
                  href="https://www.instagram.com/stpetemusic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  @StPeteMusic
                </a>{' '}
                for announcements.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventbriteCard key={event.eventbrite_id} event={event} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
