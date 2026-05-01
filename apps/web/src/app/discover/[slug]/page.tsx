import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getArtistBySlug, getArtistShows, getAllArtistSlugs } from '@/lib/queries/artists';
import type { Artist } from '@stpetemusic/types';

export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllArtistSlugs();
    return slugs.map(slug => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const artist = await getArtistBySlug(slug);
    if (!artist) return {};
    return {
      title: artist.name,
      description: artist.description ?? `${artist.name} — ${artist.type} from St. Petersburg, FL. Featured on @StPeteMusic.`,
      openGraph: {
        title: `St. Pete Music | ${artist.name}`,
        description: artist.description ?? `${artist.name} — ${artist.type} from St. Pete, FL.`,
        url: `https://www.stpetemusic.live/discover/${slug}`,
        ...(artist.hero_photo_url ? { images: [{ url: artist.hero_photo_url }] } : {}),
      },
    };
  } catch {
    return {};
  }
}

const SOCIAL_LINKS = [
  { key: 'instagram_url',  label: 'Instagram' },
  { key: 'youtube_url',    label: 'YouTube' },
  { key: 'facebook_url',   label: 'Facebook' },
  { key: 'spotify_url',    label: 'Spotify' },
  { key: 'bandcamp_url',   label: 'Bandcamp' },
  { key: 'soundcloud_url', label: 'SoundCloud' },
  { key: 'linktree_url',   label: 'Linktree' },
  { key: 'website',        label: 'Website' },
] as const;

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;

  let artist: Awaited<ReturnType<typeof getArtistBySlug>>;
  let artistShows: Awaited<ReturnType<typeof getArtistShows>>;

  try {
    artist = await getArtistBySlug(slug);
  } catch {
    notFound();
  }

  if (!artist) notFound();

  try {
    artistShows = await getArtistShows(artist.id);
  } catch {
    artistShows = [];
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    description: artist.description,
    ...(artist.instagram_url ? { sameAs: [artist.instagram_url] } : {}),
    ...(artist.hero_photo_url ? { image: artist.hero_photo_url } : {}),
  };

  const socialLinks = SOCIAL_LINKS
    .map(({ key, label }) => ({ label: label as string, url: (artist as Artist)[key] as string | undefined }))
    .filter((l): l is { label: string; url: string } => !!l.url);

  const extraLinks: { label: string; url: string }[] = artist.extra_links ?? [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main className="min-h-screen bg-surface">

        {/* Hero */}
        <div className="relative w-full bg-black overflow-hidden" style={{ minHeight: '40vh' }}>
          {artist.hero_photo_url ? (
            <Image
              src={artist.hero_photo_url}
              alt={artist.name}
              fill
              className="object-cover opacity-70"
              priority
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)' }}
          />
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col justify-end" style={{ minHeight: '40vh' }}>
            <p className="font-inter font-medium text-sm tracking-[0.45em] uppercase mb-3" style={{ color: '#B57048' }}>
              {artist.type}
            </p>
            <h1 className="font-inter font-black uppercase leading-none text-white" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
              {artist.name}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left: description + past shows */}
            <div className="lg:col-span-2">

              {/* Genre tags */}
              {(artist.genres ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {artist.genres.map(g => (
                    <span key={g} className="font-inter text-xs uppercase tracking-wider px-3 py-1 border border-border text-text-muted">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {artist.description && (
                <p className="font-inter text-text-secondary text-xl leading-relaxed mb-10 max-w-2xl">
                  {artist.description}
                </p>
              )}

              {/* Past shows */}
              {artistShows.length > 0 && (
                <div>
                  <h2 className="font-inter font-black text-2xl uppercase text-black mb-1">Past Shows</h2>
                  <span className="section-underline mb-8" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    {artistShows.map(show => (
                      <div key={show.id} className="bg-white border border-border p-5">
                        <p className="font-inter font-medium text-xs tracking-[0.3em] uppercase mb-1 text-text-muted">
                          {show.show_date ?? ''}{show.venue_name ? ` · ${show.venue_name}` : ''}
                        </p>
                        <p className="font-inter font-bold text-base text-black mb-3">{show.title}</p>
                        {show.youtube_url && (
                          <a
                            href={show.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-inter font-bold text-xs uppercase tracking-widest text-black hover:opacity-60 transition-opacity"
                          >
                            Watch →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: social links + CTA */}
            <div>
              <div className="bg-white border border-border p-8 sticky top-24">

                {/* Primary CTA */}
                {artist.instagram_url && (
                  <a
                    href={artist.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center text-white font-inter font-bold text-sm uppercase tracking-widest px-8 py-4 bg-black hover:opacity-85 transition-opacity mb-8"
                  >
                    Follow on Instagram
                  </a>
                )}

                {/* Social links */}
                {(socialLinks.length > 0 || extraLinks.length > 0) && (
                  <div className="flex flex-col gap-3">
                    {socialLinks.map(link => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-inter text-base text-text-secondary hover:text-black transition-colors flex items-center justify-between group"
                      >
                        <span>{link.label}</span>
                        <span className="text-text-muted group-hover:text-black transition-colors">→</span>
                      </a>
                    ))}
                    {extraLinks.map(link => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-inter text-base text-text-secondary hover:text-black transition-colors flex items-center justify-between group"
                      >
                        <span>{link.label}</span>
                        <span className="text-text-muted group-hover:text-black transition-colors">→</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Email */}
                {artist.email && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="font-inter text-xs uppercase tracking-[0.3em] text-text-muted mb-1">Contact</p>
                    <a
                      href={`mailto:${artist.email}`}
                      className="font-inter text-sm text-text-secondary hover:text-black transition-colors break-all"
                    >
                      {artist.email}
                    </a>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-border">
                  <Link
                    href="/discover"
                    className="font-inter text-sm text-text-muted hover:text-black transition-colors uppercase tracking-widest"
                  >
                    ← All Artists
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
