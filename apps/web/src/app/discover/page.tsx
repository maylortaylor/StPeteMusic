import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ArtistCard } from '@/components/ArtistCard';
import { getAllArtists } from '@/lib/queries/artists';

export const metadata: Metadata = {
  title: 'Discover St. Pete Artists',
  description:
    'Explore bands, DJs, solo artists, and creatives from the greater St. Petersburg, FL area. All genres, all types, no gatekeeping.',
  openGraph: {
    title: 'St. Pete Music | Discover St. Pete Artists',
    description:
      'Explore bands, DJs, solo artists, and creatives from the greater St. Petersburg, FL area. All genres, all types, no gatekeeping.',
    url: 'https://www.stpetemusic.live/discover',
  },
};

export default async function DiscoverPage() {
  let artists: Awaited<ReturnType<typeof getAllArtists>> = [];
  try {
    artists = await getAllArtists();
  } catch {
    // DB unavailable — render empty state gracefully
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'St. Pete Artists',
    description: 'Local bands and artists featured on @StPeteMusic in St. Petersburg, FL',
    itemListElement: artists.map((a, i) => ({
      '@type': 'MusicGroup',
      position: i + 1,
      name: a.name,
      ...(a.instagram_url ? { sameAs: a.instagram_url } : {}),
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
              Community
            </p>
            <h1 className="font-inter font-black text-5xl sm:text-7xl uppercase leading-none text-black mb-3">
              Discover
            </h1>
            <span className="section-underline" />
          </div>

          <p className="font-inter text-text-secondary text-lg max-w-xl mt-6 mb-12">
            Bands, DJs, solo artists, and creatives from the greater St. Petersburg, FL area. All genres, no gatekeeping.
          </p>

          {/* Venues CTA */}
          <div className="flex items-center gap-6 mb-16">
            <Link
              href="/venues"
              className="font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 border border-black text-black hover:bg-black hover:text-white transition-all"
            >
              Browse Venues →
            </Link>
          </div>

          {/* Artist grid */}
          {artists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {artists.map(artist => (
                <ArtistCard
                  key={artist.id}
                  name={artist.name}
                  slug={artist.slug}
                  type={artist.type}
                  instagram_handle={artist.instagram_handle ?? undefined}
                  genres={artist.genres ?? []}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-white p-12 text-center">
              <p className="font-inter text-text-muted text-base">
                Artist directory coming soon. All genres, all types, no gatekeeping.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
