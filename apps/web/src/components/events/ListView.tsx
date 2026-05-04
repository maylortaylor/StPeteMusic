'use client';

import type { Event } from '@stpetemusic/types';
import { EVENT_TAGS, isEventTagSlug } from '@/lib/eventTags';
import { VENUES, isVenueSlug } from '@/lib/venues';
import { pushEvent } from '@/lib/analytics';

function formatDateHeader(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

function getDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/New_York',
  });
}

interface ListViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function ListView({ events, onEventClick }: ListViewProps) {
  if (events.length === 0) {
    return (
      <div className="border border-border bg-white p-12 text-center">
        <p className="font-inter text-text-muted text-base">No events this month.</p>
      </div>
    );
  }

  // Group by date
  const groups: { dateKey: string; dateLabel: string; events: Event[] }[] = [];
  for (const event of events) {
    const key = getDateKey(event.start_time);
    const last = groups[groups.length - 1];
    if (last && last.dateKey === key) {
      last.events.push(event);
    } else {
      groups.push({ dateKey: key, dateLabel: formatDateHeader(event.start_time), events: [event] });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map(group => (
        <div key={group.dateKey}>
          <h3 className="font-inter font-bold text-sm uppercase tracking-[0.25em] text-text-muted mb-3 pb-2 border-b border-border">
            {group.dateLabel}
          </h3>
          <div className="flex flex-col gap-3">
            {group.events.map(event => {
              const tagConfig =
                event.tag && isEventTagSlug(event.tag) ? EVENT_TAGS[event.tag] : null;
              const venueConfig =
                event.venue && isVenueSlug(event.venue) ? VENUES[event.venue] : null;
              return (
                <button
                  key={event.id}
                  onClick={() => {
                    pushEvent('event_click', {
                      event_title: event.title,
                      event_venue: event.venue ?? '',
                    });
                    onEventClick(event);
                  }}
                  className="w-full text-left bg-white border border-border hover:border-black transition-colors duration-150 p-5 group"
                >
                  <div className="flex items-start gap-3">
                    {/* Color bar — venue color takes priority */}
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: venueConfig?.color ?? tagConfig?.hex ?? '#6B7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      {/* Venue + tag label row */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {venueConfig && (
                          <span
                            className="font-inter text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: venueConfig.color + '1a', color: venueConfig.color }}
                          >
                            {venueConfig.name}
                          </span>
                        )}
                        {tagConfig && (
                          <p
                            className="font-inter text-xs uppercase tracking-widest font-medium"
                            style={{ color: tagConfig.hex }}
                          >
                            {tagConfig.label}
                          </p>
                        )}
                      </div>
                      {/* Title */}
                      <h4 className="font-inter font-black text-base uppercase text-black group-hover:opacity-70 transition-opacity mb-1 truncate">
                        {event.title}
                      </h4>
                      {/* Time + location */}
                      <p className="font-inter text-sm text-text-muted">
                        {formatTime(event.start_time)}
                        {event.location && ` · ${event.location}`}
                      </p>
                      {/* Performers */}
                      {event.performers.length > 0 && (
                        <p className="font-inter text-xs text-text-muted mt-1 truncate">
                          {event.performers.map(a => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    {/* Ticket CTA */}
                    {event.ticket_url && (
                      <a
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => {
                          e.stopPropagation();
                          pushEvent('outbound_link_click', {
                            link_url: event.ticket_url,
                            link_text: 'Tickets',
                          });
                        }}
                        className="flex-shrink-0 font-inter font-bold text-xs uppercase tracking-wide text-white px-3 py-2 rounded hover:opacity-90 transition-opacity self-center"
                        style={{ backgroundColor: '#FF8C00' }}
                      >
                        Tickets
                      </a>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
