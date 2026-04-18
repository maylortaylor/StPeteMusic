import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

const FEATURED_ARTISTS = [
  { name: 'Movie Props', instagram: '@moviepropsband', type: 'Band' },
  { name: 'Viorica', instagram: '@Viorica.Band', type: 'Band' },
  { name: 'Aliqua', instagram: '@_aliqua', type: 'Band' },
  { name: 'Physical Plant', instagram: '@physical_plant', type: 'Band' },
];

export default function DiscoverPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-1 h-6 bg-brand-azure rounded-full" />
            <p className="text-brand-azure font-oswald text-xs uppercase tracking-widest">
              Community
            </p>
          </div>
          <h1 className="font-montserrat font-black text-4xl sm:text-5xl text-white mb-4">
            Discover St. Pete Artists
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mb-12">
            Bands, DJs, solo artists, and venues from the greater St. Petersburg, FL area.
          </p>

          <h2 className="font-montserrat font-bold text-xl text-white mb-6">
            Featured on @StPeteMusic
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {FEATURED_ARTISTS.map((artist) => (
              <div
                key={artist.name}
                className="bg-surface border border-border rounded-xl p-6 hover:border-brand-azure transition-colors"
              >
                <p className="text-brand-salmon font-oswald text-xs uppercase tracking-widest mb-2">
                  {artist.type}
                </p>
                <h3 className="font-oswald font-semibold text-lg text-white mb-1">
                  {artist.name}
                </h3>
                <a
                  href={`https://www.instagram.com/${artist.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-azure text-sm hover:underline"
                >
                  {artist.instagram}
                </a>
              </div>
            ))}
          </div>

          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-secondary font-open-sans text-base">
              Full artist and venue directory coming soon. All genres, all types, no gatekeeping.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
