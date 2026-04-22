import Image from 'next/image';

const COLUMNS = [
  {
    heading: 'Shows',
    links: [
      { label: 'Final Friday',    href: 'https://final-friday.eventbrite.com/' },
      { label: 'Instant Noodles', href: null },
      { label: 'Art Walk',        href: null },
    ],
  },
  {
    heading: 'Follow',
    links: [
      { label: 'Instagram', href: 'https://www.instagram.com/StPeteMusic' },
      { label: 'YouTube',   href: 'https://youtube.com/@StPeteMusic' },
      { label: 'Facebook',  href: 'https://www.facebook.com/stpeteflmusic/' },
    ],
  },
  {
    heading: 'More',
    links: [
      { label: 'Suite E Studios', href: 'https://linktr.ee/suite_e_studios' },
      { label: 'All Links',       href: 'https://linktr.ee/stpetemusic' },
      { label: 'Contact',         href: 'mailto:TheBurgMusic@gmail.com' },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: '#141414' }} className="px-6 py-20 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-16 mb-16">
          <div>
            <Image
              src="/images/brand/spm-logo-cable-white.png"
              alt="StPeteMusic"
              width={160}
              height={64}
              className="object-contain mb-4"
              style={{ height: 56, width: 'auto' }}
            />
            <p className="font-open-sans text-base text-text-muted">St. Petersburg, FL</p>
            <p className="font-open-sans text-base mt-0.5 text-text-muted" style={{ opacity: 0.6 }}>Warehouse Arts District</p>
          </div>

          <div className="flex gap-16 flex-wrap">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="font-oswald text-sm tracking-[0.35em] uppercase mb-5 text-brand-orange">
                  {col.heading}
                </p>
                <div className="flex flex-col gap-3">
                  {col.links.map((link) =>
                    link.href ? (
                      <a
                        key={link.label}
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="font-open-sans text-lg text-text-muted hover:text-text-primary transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span key={link.label} className="font-open-sans text-lg text-text-muted">
                        {link.label}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between gap-4" style={{ borderColor: 'rgba(72,141,181,0.2)' }}>
          <p className="font-open-sans text-base text-text-muted" style={{ opacity: 0.5 }}>
            © {new Date().getFullYear()} StPeteMusic / Suite E Studios
          </p>
          <p className="font-oswald text-sm tracking-[0.2em] uppercase text-text-muted" style={{ opacity: 0.4 }}>
            Warehouse Arts District · St. Pete FL
          </p>
        </div>
      </div>
    </footer>
  );
}
