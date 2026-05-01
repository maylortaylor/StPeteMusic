import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getVenueBySlug, getAllVenueSlugs } from '@/lib/queries/venues';
import type { Venue } from '@stpetemusic/types';

export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllVenueSlugs();
    return slugs.map(slug => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const venue = await getVenueBySlug(slug);
    if (!venue) return {};
    return {
      title: venue.name,
      description: venue.description ?? `${venue.name} — live music venue in St. Petersburg, FL.`,
      openGraph: {
        title: `St. Pete Music | ${venue.name}`,
        description: venue.description ?? `${venue.name} — live music in St. Pete, FL.`,
        url: `https://www.stpetemusic.live/venues/${slug}`,
        ...(venue.hero_photo_url ? { images: [{ url: venue.hero_photo_url }] } : {}),
      },
    };
  } catch {
    return {};
  }
}

const SOCIAL_LINKS = [
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'facebook_url',  label: 'Facebook' },
  { key: 'website',       label: 'Website' },
] as const;

export default async function VenuePage({ params }: Props) {
  const { slug } = await params;

  let venue;
  try {
    venue = await getVenueBySlug(slug);
  } catch {
    notFound();
  }

  if (!venue) notFound();

  const socialLinks = SOCIAL_LINKS
    .map(({ key, label }) => ({ label: label as string, url: (venue as Venue)[key] as string | undefined }))
    .filter((l): l is { label: string; url: string } => !!l.url);

  const extraLinks: { label: string; url: string }[] = venue.extra_links ?? [];
  const hasMap = venue.lat != null && venue.lng != null;
  const mapsUrl = venue.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`
    : hasMap
      ? `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`
      : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    name: venue.name,
    description: venue.description,
    address: venue.address,
    ...(hasMap ? { geo: { '@type': 'GeoCoordinates', latitude: venue.lat, longitude: venue.lng } } : {}),
    ...(venue.instagram_url ? { sameAs: [venue.instagram_url] } : {}),
    ...(venue.hero_photo_url ? { image: venue.hero_photo_url } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main className="min-h-screen bg-surface">

        {/* Hero */}
        <div className="relative w-full bg-black overflow-hidden" style={{ minHeight: '36vh' }}>
          {venue.hero_photo_url ? (
            <Image
              src={venue.hero_photo_url}
              alt={venue.name}
              fill
              className="object-cover opacity-70"
              priority
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)' }}
          />
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 flex flex-col justify-end" style={{ minHeight: '36vh' }}>
            <p className="font-inter font-medium text-sm tracking-[0.45em] uppercase mb-3" style={{ color: '#B57048' }}>
              St. Petersburg, FL
            </p>
            <h1 className="font-inter font-black uppercase leading-none text-white" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
              {venue.name}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left: details */}
            <div className="lg:col-span-2">

              {/* Description */}
              {venue.description && (
                <p className="font-inter text-text-secondary text-xl leading-relaxed mb-10 max-w-2xl">
                  {venue.description}
                </p>
              )}

              {/* Address + capacity */}
              <div className="flex flex-col gap-3 mb-8">
                {venue.address && (
                  <div className="flex items-start gap-3">
                    <span className="font-inter font-bold text-xs uppercase tracking-[0.3em] text-text-muted w-20 shrink-0 pt-0.5">Address</span>
                    <span className="font-inter text-base text-text-secondary">{venue.address}</span>
                  </div>
                )}
                {venue.capacity != null && (
                  <div className="flex items-start gap-3">
                    <span className="font-inter font-bold text-xs uppercase tracking-[0.3em] text-text-muted w-20 shrink-0 pt-0.5">Capacity</span>
                    <span className="font-inter text-base text-text-secondary">~{venue.capacity}</span>
                  </div>
                )}
                {venue.phone && (
                  <div className="flex items-start gap-3">
                    <span className="font-inter font-bold text-xs uppercase tracking-[0.3em] text-text-muted w-20 shrink-0 pt-0.5">Phone</span>
                    <a href={`tel:${venue.phone}`} className="font-inter text-base text-text-secondary hover:text-black transition-colors">
                      {venue.phone}
                    </a>
                  </div>
                )}
                {venue.email && (
                  <div className="flex items-start gap-3">
                    <span className="font-inter font-bold text-xs uppercase tracking-[0.3em] text-text-muted w-20 shrink-0 pt-0.5">Email</span>
                    <a href={`mailto:${venue.email}`} className="font-inter text-base text-text-secondary hover:text-black transition-colors break-all">
                      {venue.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Tags */}
              {(venue.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {venue.tags.map(t => (
                    <span key={t} className="font-inter text-xs uppercase tracking-wider px-3 py-1 border border-border text-text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Google Maps link */}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 border border-black text-black hover:bg-black hover:text-white transition-all"
                >
                  View on Google Maps →
                </a>
              )}
            </div>

            {/* Right: social + CTA */}
            <div>
              <div className="bg-white border border-border p-8 sticky top-24">

                {/* Primary CTA */}
                {venue.instagram_url && (
                  <a
                    href={venue.instagram_url}
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

                <div className="mt-6 pt-6 border-t border-border">
                  <Link
                    href="/venues"
                    className="font-inter text-sm text-text-muted hover:text-black transition-colors uppercase tracking-widest"
                  >
                    ← All Venues
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
