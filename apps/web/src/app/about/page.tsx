import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'About',
  description:
    'St. Pete Music is a community hub for the live music scene in St. Petersburg, FL — connecting local artists, venues, and fans.',
  openGraph: {
    title: 'About St. Pete Music | Community Music in St. Petersburg, FL',
    description:
      'St. Pete Music is a community hub for the live music scene in St. Petersburg, FL — connecting local artists, venues, and fans.',
    url: 'https://www.stpetemusic.live/about',
    siteName: 'St. Pete Music',
    type: 'website',
    images: [
      {
        url: '/images/brand/spm-logo-palm.png',
        width: 1200,
        height: 630,
        alt: 'St. Pete Music',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About St. Pete Music | Community Music in St. Petersburg, FL',
    description:
      'St. Pete Music is a community hub for the live music scene in St. Petersburg, FL — connecting local artists, venues, and fans.',
    images: ['https://www.stpetemusic.live/images/brand/spm-logo-palm.png'],
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'St. Pete Music',
  url: 'https://www.stpetemusic.live',
  description:
    'A community hub for the live music scene in St. Petersburg, FL — built by Tangent LLC in partnership with Suite E Studios.',
  founder: [
    { '@type': 'Person', name: 'Matt Taylor' },
    { '@type': 'Person', name: 'Austen Van Der Bleek' },
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '615 27th St S STE E',
    addressLocality: 'St. Petersburg',
    addressRegion: 'FL',
    postalCode: '33712',
    addressCountry: 'US',
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Nav />
      <main className="min-h-screen px-6 py-24">
        <div className="max-w-3xl mx-auto">

          <div className="mb-12">
            <p
              className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-4"
              style={{ color: '#FF8C00' }}
            >
              St. Petersburg, FL
            </p>
            <h1 className="font-inter font-black text-5xl sm:text-6xl uppercase leading-none text-black mb-3">
              About
            </h1>
            <span className="section-underline mb-8 block" />
          </div>

          <div className="mb-12">
            <Image
              src="/images/brand/spm-logo-palm.png"
              alt="St. Pete Music"
              width={200}
              height={200}
              className="object-contain mb-8"
            />
          </div>

          <div className="prose prose-lg max-w-none space-y-8 font-inter text-black/80">

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Who we are</h2>
              <p>
                St. Pete Music is a community hub for the live music scene in St. Petersburg, FL.
                We surface local artists, spotlight the venues keeping the scene alive, and keep
                fans connected to what&apos;s happening in their city.
              </p>
              <p className="mt-4">
                We take pride in helping the community by being partnered with{' '}
                <a
                  href="https://www.suiteestudios.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-orange underline"
                >
                  Suite E Studios
                </a>{' '}.
                An independent music and arts third-space at 615 27th St S in St. Petersburg.
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">What we do</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Promote local bands, musicians, DJs, and artists of all types in the Tampa Bay & St Pete, FL area</li>
                <li>List upcoming shows, concerts, and community events</li>
                <li>Spotlight local music venues</li>
                <li>Send a monthly newsletter with what&apos;s happening in the St. Pete music scene</li>
              </ul>
            </section>


          </div>

          <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-6">
            <Link
              href="/"
              className="font-inter font-bold text-sm uppercase tracking-wide text-black/60 hover:text-black transition-colors"
            >
              ← Back to Home
            </Link>
            <Link
              href="/discover"
              className="font-inter font-bold text-sm uppercase tracking-wide text-black/60 hover:text-black transition-colors"
            >
              Discover Artists →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
