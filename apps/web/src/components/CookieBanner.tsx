'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'spm_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Cookie notice"
      className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between gap-4 flex-wrap
                 bg-black/90 backdrop-blur-sm px-6 py-4 text-white
                 sm:rounded-t-lg sm:max-w-2xl sm:mx-auto sm:bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      <p className="font-inter text-sm text-white/80 flex-1 min-w-[200px]">
        This site uses cookies for analytics.{' '}
        <Link href="/privacy" className="underline text-white hover:text-brand-orange transition-colors">
          Learn more
        </Link>
      </p>
      <button
        onClick={dismiss}
        className="font-inter font-bold text-sm uppercase tracking-wide bg-white text-black
                   px-5 py-2 rounded-lg hover:bg-white/90 transition-colors shrink-0"
        aria-label="Accept cookies and dismiss banner"
      >
        OK
      </button>
    </div>
  );
}
