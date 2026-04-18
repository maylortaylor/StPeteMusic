import Link from 'next/link';

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-border"
      style={{ backgroundColor: 'rgba(13,11,30,0.96)' }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link
          href="/"
          className="font-montserrat font-black text-xl tracking-[0.2em] uppercase"
          style={{
            background: 'linear-gradient(90deg, #E7A4E7, #AB91E8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          StPeteMusic
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link href="/events"   className="text-text-secondary hover:text-text-primary font-open-sans text-base transition-colors">Events</Link>
          <Link href="/discover" className="text-text-secondary hover:text-text-primary font-open-sans text-base transition-colors">Discover</Link>
          <a href="https://youtube.com/@StPeteMusic" target="_blank" rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary font-open-sans text-base transition-colors">YouTube</a>
        </div>

        <a
          href="https://final-friday.eventbrite.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white font-montserrat font-bold text-sm uppercase tracking-wide px-5 py-2 rounded-full transition-opacity hover:opacity-85"
          style={{ background: 'linear-gradient(90deg, #E7A4E7, #483E8E)' }}
        >
          Get Tickets
        </a>
      </div>
    </nav>
  );
}
