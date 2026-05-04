'use client';

import Link from 'next/link';
import { pushEvent } from '@/lib/analytics';

interface ArtistCardProps {
  name: string;
  slug: string;
  type: string;
  instagram_handle?: string;
  genres: string[];
}

export function ArtistCard({ name, slug, type, instagram_handle, genres }: ArtistCardProps) {
  return (
    <Link
      href={`/discover/${slug}`}
      className="block group"
      onClick={() => pushEvent('artist_click', { artist_name: name })}
    >
      <div className="bg-white border border-border hover:border-black transition-colors duration-200 p-6 h-full flex flex-col">
        <p className="font-inter font-medium text-xs uppercase tracking-[0.3em] mb-2" style={{ color: '#B57048' }}>
          {type}
        </p>
        <h3 className="font-inter font-black text-xl uppercase leading-tight text-black mb-2 group-hover:opacity-70 transition-opacity">
          {name}
        </h3>
        {instagram_handle && (
          <p className="font-inter text-sm text-text-muted mb-3">
            {instagram_handle.startsWith('@') ? instagram_handle : `@${instagram_handle}`}
          </p>
        )}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
            {genres.map(g => (
              <span
                key={g}
                className="font-inter text-xs uppercase tracking-wider px-2 py-0.5 border border-border text-text-muted"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
