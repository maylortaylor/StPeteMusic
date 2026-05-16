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
