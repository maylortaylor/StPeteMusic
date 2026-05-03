'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@stpetemusic/types';
import type { EventTagSlug } from '@/lib/eventTags';
import { isEventTagSlug } from '@/lib/eventTags';
import type { VenueSlug } from '@/lib/venues';
import { isVenueSlug } from '@/lib/venues';
import { MonthTabs } from './MonthTabs';
import { VenueFilterRow } from './VenueFilterRow';
import { TagFilterChips } from './TagFilterChips';
import { CalendarGrid } from './CalendarGrid';
import { ListView } from './ListView';
import { EventModal } from './EventModal';

type ViewMode = 'calendar' | 'list';

interface MonthData {
  label: string;
  year: number;
  month: number; // 1-indexed
  events: Event[];
}

interface EventsPageClientProps {
  months: MonthData[];
}

export function EventsPageClient({ months }: EventsPageClientProps) {
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  const [activeVenue, setActiveVenue] = useState<VenueSlug | 'ALL'>('ALL');
  const [activeTag, setActiveTag] = useState<EventTagSlug | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (window.innerWidth < 768) setViewMode('list');
  }, []);

  const currentMonth = months[activeMonthIdx];

  const filteredEvents = currentMonth.events.filter(event => {
    const venueMatch = activeVenue === 'ALL' || event.venue === activeVenue;
    const tagMatch = activeTag === 'ALL' || event.tag === activeTag;
    return venueMatch && tagMatch;
  });

  // Only show venues that have at least one event in this month
  const availableVenues = new Set(
    currentMonth.events
      .map(e => e.venue)
      .filter((v): v is string => v !== null && isVenueSlug(v)),
  );

  // Only show tags that have at least one event in this month (respecting active venue filter)
  const eventsForTagCounting = activeVenue === 'ALL'
    ? currentMonth.events
    : currentMonth.events.filter(e => e.venue === activeVenue);

  const availableTags = new Set(
    eventsForTagCounting
      .map(e => e.tag)
      .filter((t): t is string => t !== null && isEventTagSlug(t)),
  );

  return (
    <>
      {/* Month tabs */}
      <MonthTabs
        tabs={months.map(m => ({ label: m.label, year: m.year, month: m.month }))}
        active={activeMonthIdx}
        onChange={idx => {
          setActiveMonthIdx(idx);
          setActiveVenue('ALL');
          setActiveTag('ALL');
        }}
      />

      {/* Venue filter row */}
      <VenueFilterRow
        active={activeVenue}
        onChange={slug => {
          setActiveVenue(slug);
          setActiveTag('ALL');
        }}
        availableVenues={availableVenues}
      />

      {/* Tag filter chips */}
      <TagFilterChips
        activeTag={activeTag}
        onChange={setActiveTag}
        availableTags={availableTags}
      />

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        {(['calendar', 'list'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`font-inter text-xs uppercase tracking-[0.25em] px-4 py-2 border transition-colors duration-150 ${
              viewMode === mode
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-border hover:border-black'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredEvents.length === 0 && (
        <div className="border border-border bg-white p-12 text-center">
          <p className="font-inter text-text-muted text-base">No events this month.</p>
        </div>
      )}

      {/* Calendar or list */}
      {filteredEvents.length > 0 && viewMode === 'calendar' && (
        <CalendarGrid
          year={currentMonth.year}
          month={currentMonth.month}
          events={filteredEvents}
          onEventClick={setSelectedEvent}
        />
      )}
      {filteredEvents.length > 0 && viewMode === 'list' && (
        <ListView events={filteredEvents} onEventClick={setSelectedEvent} />
      )}

      {/* Event detail modal */}
      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </>
  );
}
