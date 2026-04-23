/** @format */

import Image from "next/image";

const COLUMNS = [
  {
    heading: "Shows",
    links: [
      { label: "Final Friday", href: "https://final-friday.eventbrite.com/" },
      { label: "Instant Noodles", href: null },
      { label: "Art Walk", href: null },
    ],
  },
  {
    heading: "Follow",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/StPeteMusic" },
      { label: "YouTube", href: "https://youtube.com/@StPeteMusic" },
      { label: "Facebook", href: "https://www.facebook.com/stpeteflmusic/" },
    ],
  },
  {
    heading: "More",
    links: [
      { label: "Suite E Studios", href: "https://linktr.ee/suite_e_studios" },
      { label: "All Links", href: "https://linktr.ee/stpetemusic" },
      { label: "Contact", href: "mailto:TheBurgMusic@gmail.com" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-gradient-orange px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="items-center flex flex-col md:flex-row justify-between gap-16 mb-16">
          <div>
            <Image
              src="/images/brand/spm-logo-palm.png"
              alt="StPeteMusic"
              width={250}
              height={250}
              className="object-contain  mb-4"
              // style={{ height: 200, width: 'auto' }}
            />
          </div>

          <div>
            <p className="font-inter text-base text-black/70">
              St. Petersburg, FL
            </p>
            <p className="font-inter text-base mt-0.5 text-black/60">
              Warehouse Arts District
            </p>
          </div>

          <div className="flex gap-16 flex-wrap">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="font-inter font-black text-sm tracking-[0.35em] uppercase mb-5 text-black">
                  {col.heading}
                </p>
                <div className="flex flex-col gap-3">
                  {col.links.map((link) =>
                    link.href ? (
                      <a
                        key={link.label}
                        href={link.href}
                        target={
                          link.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel={
                          link.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="font-inter text-lg text-black/70 hover:text-black transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span
                        key={link.label}
                        className="font-inter text-lg text-black/60"
                      >
                        {link.label}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-black/20 pt-8 flex flex-col sm:flex-row justify-between gap-4">
          <p className="font-inter text-base text-black/60">
            © {new Date().getFullYear()} StPeteMusic / Suite E Studios
          </p>
          <p className="font-inter font-medium text-sm tracking-[0.2em] uppercase text-black/50">
            Warehouse Arts District · St. Pete FL
          </p>
        </div>
      </div>
    </footer>
  );
}
