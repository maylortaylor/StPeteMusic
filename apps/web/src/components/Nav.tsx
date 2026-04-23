import Link from 'next/link';
import Image from 'next/image';

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-gradient-orange" style={{ height: '64px' }}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-full">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/brand/spm-logo-main.png"
            alt="StPeteMusic"
            width={250}
            height={100}
            className="object-contain"
            style={{ height: 75, width: 'auto' }}
          />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link href="/events"   className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">Events</Link>
          <Link href="/discover" className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">Discover</Link>
          <a href="https://youtube.com/@StPeteMusic" target="_blank" rel="noopener noreferrer"
            className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">YouTube</a>
        </div>

        <a
          href="https://final-friday.eventbrite.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-inter font-bold text-sm uppercase tracking-wide px-5 py-2 bg-black text-white hover:opacity-85 transition-opacity"
        >
          Get Tickets
        </a>
      </div>
    </nav>
  );
}
