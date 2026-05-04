'use client';

import Link from 'next/link';
import { pushEvent } from '@/lib/analytics';

interface VenueCardProps {
  name: string;
  slug: string;
  address?: string;
  instagram_url?: string;
  tags: string[];
}

export function VenueCard({ name, slug, address, tags }: VenueCardProps) {
  return (
    <Link
      href={`/venues/${slug}`}
      className="block group"
      onClick={() => pushEvent('venue_click', { venue_name: name })}
    >
      <div className="bg-white border border-border hover:border-black transition-colors duration-200 p-6 h-full flex flex-col">
        <h3 className="font-inter font-black text-xl uppercase leading-tight text-black mb-2 group-hover:opacity-70 transition-opacity">
          {name}
        </h3>
        {address && (
          <p className="font-inter text-sm text-text-muted leading-snug mb-3">
            {address}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
            {tags.map(t => (
              <span
                key={t}
                className="font-inter text-xs uppercase tracking-wider px-2 py-0.5 border border-border text-text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
