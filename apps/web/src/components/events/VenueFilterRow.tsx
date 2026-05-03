'use client';

import { VENUES, type VenueSlug } from '@/lib/venues';

interface VenueFilterRowProps {
  active: VenueSlug | 'ALL';
  onChange: (venue: VenueSlug | 'ALL') => void;
  /** When provided, only these venue slugs are rendered (plus ALL). */
  availableVenues?: Set<string>;
}

export function VenueFilterRow({ active, onChange, availableVenues }: VenueFilterRowProps) {
  return (
    <div className="mb-2">
      <p className="font-inter text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">
        Venue
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* ALL pill */}
        <button
          onClick={() => onChange('ALL')}
          className={`flex-shrink-0 font-inter text-xs uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border transition-colors duration-150 ${
            active === 'ALL'
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-border hover:border-black'
          }`}
        >
          All Venues
        </button>

        {/* Venue pills */}
        {(Object.entries(VENUES) as [VenueSlug, (typeof VENUES)[VenueSlug]][])
          .filter(([slug]) => !availableVenues || availableVenues.has(slug))
          .map(([slug, config]) => {
            const isActive = active === slug;
            return (
              <button
                key={slug}
                onClick={() => onChange(slug)}
                style={
                  isActive
                    ? { backgroundColor: config.color, borderColor: config.color, color: 'white' }
                    : { borderColor: config.color, color: config.color }
                }
                className={`flex-shrink-0 font-inter text-xs uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border transition-colors duration-150 ${
                  isActive ? '' : 'bg-white hover:opacity-80'
                }`}
              >
                {config.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}
