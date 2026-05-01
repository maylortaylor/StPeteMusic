'use client';

import { useState } from 'react';
import { ArtistCard } from '@/components/ArtistCard';
import type { Artist } from '@stpetemusic/types';

const ALL_FILTER = 'All';
const TYPE_ORDER: Artist['type'][] = ['Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other'];

function getAvailableTypes(artists: Artist[]): string[] {
  const seen = new Set(artists.map(a => a.type).filter(Boolean));
  return TYPE_ORDER.filter(t => seen.has(t));
}

export function DiscoverClientGrid({ artists }: { artists: Artist[] }) {
  const [active, setActive] = useState<string>(ALL_FILTER);
  const [query, setQuery] = useState('');
  const types = getAvailableTypes(artists);

  const q = query.trim().toLowerCase();
  const filtered = artists.filter(a => {
    const typeMatch = active === ALL_FILTER || a.type === active;
    const searchMatch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      (a.instagram_handle ?? '').toLowerCase().includes(q);
    return typeMatch && searchMatch;
  });

  return (
    <>
      {/* Search box */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="Search artists..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (e.target.value) setActive(ALL_FILTER);
          }}
          className="w-full sm:w-80 font-inter text-sm px-4 py-2.5 border border-border bg-white text-black placeholder:text-text-muted focus:outline-none focus:border-black transition-colors"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-10">
        {[ALL_FILTER, ...types].map(t => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`font-inter text-xs uppercase tracking-[0.3em] px-4 py-2 border transition-colors duration-150 ${
              active === t
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-border hover:border-black'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="font-inter text-sm text-text-muted mb-6">
        {filtered.length} {filtered.length === 1 ? 'artist' : 'artists'}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(artist => (
            <ArtistCard
              key={artist.id}
              name={artist.name}
              slug={artist.slug}
              type={artist.type}
              instagram_handle={artist.instagram_handle ?? undefined}
              genres={artist.genres ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border bg-white p-12 text-center">
          <p className="font-inter text-text-muted text-base">No artists match your search.</p>
        </div>
      )}
    </>
  );
}
