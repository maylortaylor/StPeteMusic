'use client';

import { pushEvent } from '@/lib/analytics';

const DONATE_URL =
  process.env.NEXT_PUBLIC_DONATE_URL ?? 'https://square.link/u/MibuhN7B';

interface DonateButtonProps {
  className?: string;
}

export function DonateButton({ className }: DonateButtonProps) {
  return (
    <a
      href={DONATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        'inline-block font-inter font-bold text-sm uppercase tracking-widest px-8 py-3 bg-black text-white hover:opacity-80 transition-opacity'
      }
      onClick={() =>
        pushEvent('donate_click', { link_url: DONATE_URL, link_text: 'Donate' })
      }
    >
      Donate
    </a>
  );
}
