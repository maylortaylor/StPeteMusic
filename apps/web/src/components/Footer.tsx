'use client';

import Image from 'next/image';
import Link from 'next/link';
import { pushEvent } from '@/lib/analytics';

const COLUMNS = [
  {
    heading: 'Follow',
    links: [
      { label: 'Instagram', href: 'https://www.instagram.com/StPeteMusic' },
      { label: 'YouTube', href: 'https://youtube.com/@StPeteMusic' },
      { label: 'Facebook', href: 'https://www.facebook.com/stpeteflmusic/' },
    ],
  },
  {
    heading: 'Friends',
    links: [
      { label: 'Suite E Studios', href: 'https://www.suiteestudios.com' },
      { label: 'Bayboro Brewing', href: 'https://www.bayborobrewing.com/' },
      { label: 'Cage Brewing', href: 'https://cagebrewing.com/' },
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
            />
          </div>

          <div>
            <p className="font-inter text-base text-black/70">
              St. Petersburg, FL
            </p>
            <p className="font-inter text-base mt-0.5 text-black/70">
              Community Driven Music
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
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        onClick={() =>
                          pushEvent('outbound_link_click', {
                            link_url: link.href,
                            link_text: link.label,
                          })
                        }
                        className="font-inter text-lg text-black/70 hover:text-black transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span
                        key={link.label}
                        className="font-inter text-lg text-black/70"
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

        <div className="border-t border-black/20 pt-8 flex flex-col sm:flex-row justify-between gap-4 items-center">
          <p className="font-inter text-base text-black/70">
            © {new Date().getFullYear()} StPeteMusic / Suite E Studios
          </p>
          <Link
            href="/privacy"
            className="font-inter text-sm text-black/70 hover:text-black transition-colors"
          >
            Privacy Policy
          </Link>
          <p className="font-inter font-medium text-sm tracking-[0.2em] uppercase text-black/70">
            Live Music · Local Artists · Real Community
          </p>
        </div>
      </div>
    </footer>
  );
}
