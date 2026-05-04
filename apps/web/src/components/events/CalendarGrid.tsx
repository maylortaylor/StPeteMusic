'use client';

import type { Event } from '@stpetemusic/types';
import { EVENT_TAGS, isEventTagSlug } from '@/lib/eventTags';
import { VENUES, isVenueSlug } from '@/lib/venues';
import { pushEvent } from '@/lib/analytics';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayOfMonth(iso: string): number {
  return new Date(iso).getDate();
}

function getLocalDate(iso: string): Date {
  // Parse as Eastern time for display purposes
  return new Date(
    new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
}

interface CalendarGridProps {
  year: number;
  month: number; // 1-indexed
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function CalendarGrid({ year, month, events, onEventClick }: CalendarGridProps) {
  // Days in month, first weekday (0=Sun)
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  // Map day-of-month → events
  const eventsByDay: Map<number, Event[]> = new Map();
  for (const event of events) {
    const d = getLocalDate(event.start_time);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(event);
    }
  }

  // Build 6-row grid (max needed for any month)
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="font-inter font-medium text-xs uppercase tracking-widest text-text-muted text-center py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 border-l border-t border-border">
        {cells.map((day, i) => {
          const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
          return (
            <div
              key={i}
              className="border-r border-b border-border min-h-[80px] sm:min-h-[100px] p-1.5"
            >
              {day !== null && (
                <>
                  <span className="font-inter text-xs font-medium text-text-muted block mb-1">
                    {day}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.map(event => {
                      const venueConfig =
                        event.venue && isVenueSlug(event.venue) ? VENUES[event.venue] : null;
                      const tagConfig =
                        event.tag && isEventTagSlug(event.tag) ? EVENT_TAGS[event.tag] : null;
                      // Venue color takes priority; fall back to tag color
                      const bgColor = venueConfig?.color ?? tagConfig?.hex ?? '#6B7280';
                      return (
                        <button
                          key={event.id}
                          onClick={() => {
                            pushEvent('event_click', {
                              event_title: event.title,
                              event_venue: event.venue ?? '',
                              event_date: event.start_time,
                            });
                            onEventClick(event);
                          }}
                          className="w-full text-left font-inter text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded truncate leading-tight hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: bgColor, color: 'white' }}
                          title={`${venueConfig ? venueConfig.name + ' · ' : ''}${event.title}`}
                        >
                          {event.title}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
