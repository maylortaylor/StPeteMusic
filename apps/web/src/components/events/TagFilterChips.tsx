'use client';

import { EVENT_TAGS, type EventTagSlug } from '@/lib/eventTags';

interface TagFilterChipsProps {
  activeTag: EventTagSlug | 'ALL';
  onChange: (tag: EventTagSlug | 'ALL') => void;
  /** When provided, only these tag slugs are rendered (plus ALL). Omit to show all tags. */
  availableTags?: Set<string>;
}

export function TagFilterChips({ activeTag, onChange, availableTags }: TagFilterChipsProps) {
  return (
    <div className="mb-6">
      <p className="font-inter text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">
        Event type
      </p>
    <div className="flex flex-wrap gap-2">
      {/* ALL chip */}
      <button
        onClick={() => onChange('ALL')}
        className={`font-inter text-xs uppercase tracking-[0.25em] px-4 py-2 border transition-colors duration-150 ${
          activeTag === 'ALL'
            ? 'bg-black text-white border-black'
            : 'bg-white text-black border-border hover:border-black'
        }`}
      >
        All
      </button>

      {/* Tag chips */}
      {(Object.entries(EVENT_TAGS) as [EventTagSlug, (typeof EVENT_TAGS)[EventTagSlug]][])
        .filter(([slug]) => !availableTags || availableTags.has(slug))
        .map(
        ([slug, config]) => {
          const isActive = activeTag === slug;
          return (
            <button
              key={slug}
              onClick={() => onChange(slug)}
              style={
                isActive
                  ? { backgroundColor: config.hex, borderColor: config.hex, color: config.textColor }
                  : { borderColor: config.hex, color: config.hex }
              }
              className={`font-inter text-xs uppercase tracking-[0.25em] px-4 py-2 border transition-colors duration-150 ${
                isActive ? '' : 'bg-white hover:opacity-80'
              }`}
            >
              {config.label}
            </button>
          );
        },
      )}
    </div>
    </div>
  );
}
