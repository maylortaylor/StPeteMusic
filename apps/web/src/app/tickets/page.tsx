import type { Metadata } from 'next';
import { socialImages } from '@/config/social-images';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { EventbriteCard } from '@/components/EventbriteCard';
import { ExternalEventCard } from '@/components/ExternalEventCard';
import { getActiveEventbriteEvents } from '@/lib/queries/eventbrite';
import { getFeaturedTicketEvents, type FeaturedTicketEvent } from '@/lib/queries/tickets-extras';

const SOURCE_SECTIONS: { key: string; label: string }[] = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'google', label: 'Google Calendar' },
];

function groupBySource(events: FeaturedTicketEvent[]): { label: string; events: FeaturedTicketEvent[] }[] {
  const groups: { label: string; events: FeaturedTicketEvent[] }[] = [];
  for (const { key, label } of SOURCE_SECTIONS) {
    const matches = events.filter((e) => e.source === key);
    if (matches.length > 0) groups.push({ label, events: matches });
  }
  // Anything from a source without a dedicated section yet still shows up,
  // grouped together, rather than silently disappearing.
  const known = new Set(SOURCE_SECTIONS.map((s) => s.key));
  const other = events.filter((e) => !known.has(e.source ?? ''));
  if (other.length > 0) groups.push({ label: 'More Events', events: other });
  return groups;
}

// AWS Amplify's Next.js SSR hosting doesn't reliably persist on-demand ISR
// revalidation (revalidatePath/revalidateTag) across Lambda invocations, so a
// statically-prerendered version of this page can get stuck serving a stale
// snapshot indefinitely. Render fresh on every request instead — the
// underlying queries still have their own unstable_cache data-layer cache.
export const dynamic = 'force-dynamic';

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
    images: [{ url: socialImages.tickets, width: 1200, height: 630, alt: 'Get Tickets — St. Pete Music' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@StPeteMusic',
    creator: '@StPeteMusic',
    images: [socialImages.tickets],
  },
};

export default async function TicketsPage() {
  const [eventbriteEvents, featuredEvents] = await Promise.all([
    getActiveEventbriteEvents(),
    getFeaturedTicketEvents(),
  ]);
  const otherSections = groupBySource(featuredEvents);
  const totalCount = eventbriteEvents.length + featuredEvents.length;

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

          {totalCount === 0 ? (
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
            <div className="space-y-12">
              {eventbriteEvents.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4">Eventbrite</h2>

                  {/* Eventbrite attribution */}
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 max-w-2xl">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {eventbriteEvents.map((event) => (
                      <EventbriteCard key={event.eventbrite_id} event={event} />
                    ))}
                  </div>
                </section>
              )}

              {otherSections.map((section) => (
                <section key={section.label}>
                  <h2 className="text-xl font-bold text-foreground mb-4">{section.label}</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {section.events.map((event) => (
                      <ExternalEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
