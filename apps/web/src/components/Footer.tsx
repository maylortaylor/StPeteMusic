const COLUMNS = [
  {
    heading: 'Shows',
    accent: '#E7A4E7',
    links: [
      { label: 'Final Friday',    href: 'https://final-friday.eventbrite.com/' },
      { label: 'Instant Noodles', href: null },
      { label: 'Art Walk',        href: null },
    ],
  },
  {
    heading: 'Follow',
    accent: '#AB91E8',
    links: [
      { label: 'Instagram', href: 'https://www.instagram.com/StPeteMusic' },
      { label: 'YouTube',   href: 'https://youtube.com/@StPeteMusic' },
      { label: 'Facebook',  href: 'https://www.facebook.com/stpeteflmusic/' },
    ],
  },
  {
    heading: 'More',
    accent: '#483E8E',
    links: [
      { label: 'Suite E Studios', href: 'https://linktr.ee/suite_e_studios' },
      { label: 'All Links',       href: 'https://linktr.ee/stpetemusic' },
      { label: 'Contact',         href: 'mailto:TheBurgMusic@gmail.com' },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: '#0A0818' }} className="px-6 py-20 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-16 mb-16">
          <div>
            <p
              className="font-montserrat font-black text-2xl tracking-[0.2em] uppercase mb-3"
              style={{
                background: 'linear-gradient(90deg, #E7A4E7, #AB91E8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              StPeteMusic
            </p>
            <p className="font-open-sans text-base" style={{ color: 'rgba(171,145,232,0.4)' }}>St. Petersburg, FL</p>
            <p className="font-open-sans text-base mt-0.5" style={{ color: 'rgba(171,145,232,0.25)' }}>Warehouse Arts District</p>
          </div>

          <div className="flex gap-16 flex-wrap">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="font-oswald text-sm tracking-[0.35em] uppercase mb-5" style={{ color: col.accent }}>
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
                        className="font-open-sans text-lg transition-colors hover:text-text-secondary"
                        style={{ color: 'rgba(171,145,232,0.4)' }}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span key={link.label} className="font-open-sans text-lg" style={{ color: 'rgba(171,145,232,0.4)' }}>
                        {link.label}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col sm:flex-row justify-between gap-4" style={{ borderColor: 'rgba(72,62,142,0.2)' }}>
          <p className="font-open-sans text-base" style={{ color: 'rgba(171,145,232,0.2)' }}>
            © {new Date().getFullYear()} StPeteMusic / Suite E Studios
          </p>
          <p className="font-oswald text-sm tracking-[0.2em] uppercase" style={{ color: 'rgba(171,145,232,0.15)' }}>
            Warehouse Arts District · St. Pete FL
          </p>
        </div>
      </div>
    </footer>
  );
}
