import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { VenueCard } from '@/components/VenueCard';
import { getAllVenues } from '@/lib/queries/venues';

export const metadata: Metadata = {
  title: 'St. Pete Music Venues',
  description:
    'Discover live music venues in St. Petersburg, FL — from intimate studios to local breweries. The stages that make the St. Pete scene.',
  openGraph: {
    title: 'St. Pete Music | Venues',
    description: 'Live music venues in St. Petersburg, FL.',
    url: 'https://www.stpetemusic.live/venues',
  },
};

export default async function VenuesPage() {
  let venues: Awaited<ReturnType<typeof getAllVenues>> = [];
  try {
    venues = await getAllVenues();
  } catch {
    // DB unavailable — render empty state gracefully
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'St. Pete Live Music Venues',
    description: 'Live music venues in St. Petersburg, FL featured on @StPeteMusic',
    itemListElement: venues.map((v, i) => ({
      '@type': 'MusicVenue',
      position: i + 1,
      name: v.name,
      address: v.address,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-20">

          {/* Header */}
          <div className="mb-4">
            <p className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-4" style={{ color: '#B57048' }}>
              St. Pete, FL
            </p>
            <h1 className="font-inter font-black text-5xl sm:text-7xl uppercase leading-none text-black mb-3">
              Venues
            </h1>
            <span className="section-underline" />
          </div>

          <p className="font-inter text-text-secondary text-lg max-w-xl mt-6 mb-16">
            The stages that make the St. Pete music scene. From warehouse studios to neighborhood breweries.
          </p>

          {venues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map(venue => (
                <VenueCard
                  key={venue.id}
                  name={venue.name}
                  slug={venue.slug}
                  address={venue.address}
                  instagram_url={venue.instagram_url ?? undefined}
                  tags={venue.tags ?? []}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-white p-12 text-center">
              <p className="font-inter text-text-muted text-base">
                Venue directory coming soon.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
