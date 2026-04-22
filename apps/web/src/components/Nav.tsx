import Link from 'next/link';
import Image from 'next/image';

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-border"
      style={{ backgroundColor: 'rgba(28,28,28,0.96)', backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/brand/spm-logo-main.png"
            alt="StPeteMusic"
            width={156}
            height={62}
            className="object-contain"
            style={{ height: 52, width: 'auto' }}
          />
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
          className="font-montserrat font-bold text-sm uppercase tracking-wide px-5 py-2 rounded-sm transition-all hover:bg-brand-orange hover:text-white"
          style={{ border: '1px solid #B57048', color: '#B57048' }}
        >
          Get Tickets
        </a>
      </div>
    </nav>
  );
}
