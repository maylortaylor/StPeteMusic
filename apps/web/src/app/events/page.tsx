import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export default function EventsPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#FF8C00' }} />
            <p className="font-inter font-medium text-xs uppercase tracking-widest" style={{ color: '#FF8C00' }}>
              Calendar
            </p>
          </div>
          <h1 className="font-inter font-black text-4xl sm:text-5xl text-black mb-4">
            Shows & Events
          </h1>
          <p className="text-text-muted text-lg max-w-xl mb-12">
            Live music, community jams, and art walks in St. Petersburg, FL.
          </p>

          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-muted font-inter text-base mb-4">
              Full events calendar coming soon. In the meantime:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://final-friday.eventbrite.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-inter font-bold text-sm uppercase tracking-wide text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#FF8C00' }}
              >
                Final Friday Tickets
              </a>
              <a
                href="https://linktr.ee/stpetemusic"
                target="_blank"
                rel="noopener noreferrer"
                className="font-inter font-bold text-sm uppercase tracking-wide text-black px-6 py-3 rounded-lg border border-border hover:border-brand-burnt transition-colors"
              >
                All Links
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
