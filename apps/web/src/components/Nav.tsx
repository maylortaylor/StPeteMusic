'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { pushEvent } from '@/lib/analytics';

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-orange">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between" style={{ height: '64px' }}>
        <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
          <Image
            src="/images/brand/spm-logo-main.png"
            alt="StPeteMusic"
            width={250}
            height={100}
            className="object-contain"
            style={{ height: 75, width: 'auto' }}
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-10">
          <Link href="/events"   className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">Events</Link>
          <Link href="/discover" className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">Discover</Link>
          <Link href="/venues"   className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">Venues</Link>
          <a
            href="https://youtube.com/@StPeteMusic"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => pushEvent('outbound_link_click', { link_url: 'https://youtube.com/@StPeteMusic', link_text: 'YouTube' })}
            className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity"
          >YouTube</a>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="md:hidden flex flex-col justify-center items-center gap-1.5 p-2"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-gradient-orange border-t border-black/10 px-6 py-4 flex flex-col gap-4">
          <Link href="/events"   onClick={() => setMenuOpen(false)} className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">Events</Link>
          <Link href="/discover" onClick={() => setMenuOpen(false)} className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">Discover</Link>
          <Link href="/venues"   onClick={() => setMenuOpen(false)} className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity">Venues</Link>
          <a
            href="https://youtube.com/@StPeteMusic"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setMenuOpen(false);
              pushEvent('outbound_link_click', { link_url: 'https://youtube.com/@StPeteMusic', link_text: 'YouTube' });
            }}
            className="font-inter text-black font-medium text-base hover:opacity-70 transition-opacity"
          >YouTube</a>
        </div>
      )}
    </nav>
  );
}
