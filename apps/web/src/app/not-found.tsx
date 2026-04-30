import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-32 text-center">
        <div className="max-w-lg mx-auto">
          <p
            className="font-inter font-black text-8xl sm:text-9xl leading-none mb-4"
            style={{ color: '#FF8C00' }}
          >
            404
          </p>
          <h1 className="font-inter font-black text-3xl sm:text-4xl text-black mb-4">
            Page Not Found
          </h1>
          <p className="text-text-muted text-lg mb-10">
            Looks like this page packed up and went on tour. Let&apos;s get you back to the music.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="font-inter font-bold text-sm uppercase tracking-wide text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#FF8C00' }}
            >
              Back to Home
            </Link>
            <Link
              href="/events"
              className="font-inter font-bold text-sm uppercase tracking-wide text-black px-8 py-3 rounded-lg border border-border hover:border-brand-burnt transition-colors"
            >
              See Events
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
