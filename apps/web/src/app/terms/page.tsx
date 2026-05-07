import { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for StPeteMusic.live — how we keep things fair and fun for everyone.',
  openGraph: {
    title: 'Terms of Service | St. Pete Music',
    description: 'Terms of service for StPeteMusic.live — how we keep things fair and fun for everyone.',
    url: 'https://www.stpetemusic.live/terms',
    siteName: 'St. Pete Music',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service | St. Pete Music',
    description: 'Terms of service for StPeteMusic.live — how we keep things fair and fun for everyone.',
  },
};

const LAST_UPDATED = 'May 2026';

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-inter font-black text-4xl sm:text-5xl text-black mb-3">
            Terms of Service
          </h1>
          <p className="font-inter text-sm text-black/50 mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-lg max-w-none space-y-10 font-inter text-black/80">

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">The short version</h2>
              <p>
                StPeteMusic is a community music guide for St. Petersburg, FL. Use it to discover
                artists, find shows, and stay connected to the local music scene. Be cool. Don&apos;t
                misuse the site. That&apos;s pretty much it.
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Using this site</h2>
              <p>
                You&apos;re welcome to browse, share links, and subscribe to our newsletter. We just ask
                that you don&apos;t scrape or copy large portions of the site, don&apos;t try to break
                anything, and don&apos;t use the site for spam or anything illegal.
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Our content</h2>
              <p>
                The St. Pete Music name, logo, and brand assets belong to Tangent LLC. Artist and
                venue listings are shared in good faith to support the local music community — if
                you&apos;re listed and want something updated or removed, just{' '}
                <a href="mailto:hello@stpetemusic.live" className="text-brand-orange underline">
                  reach out
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Accuracy</h2>
              <p>
                We do our best to keep event dates, artist info, and venue details up to date, but
                things change. Always verify show times and ticket info directly with the venue or
                artist before heading out.
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Privacy & cookies</h2>
              <p>
                We use analytics and session recording tools to understand how the site is used. See
                our{' '}
                <Link href="/privacy" className="text-brand-orange underline">
                  Privacy Policy
                </Link>{' '}
                for the full picture.
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Questions?</h2>
              <p>
                Reach us at{' '}
                <a href="mailto:hello@stpetemusic.live" className="text-brand-orange underline">
                  hello@stpetemusic.live
                </a>
                . We&apos;re real people, we respond.
              </p>
            </section>

          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <Link
              href="/"
              className="font-inter font-bold text-sm uppercase tracking-wide text-black/60 hover:text-black transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
