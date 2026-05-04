'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Event } from '@stpetemusic/types';
import { pushEvent } from '@/lib/analytics';
import { EVENT_TAGS, isEventTagSlug } from '@/lib/eventTags';
import { VENUES, isVenueSlug } from '@/lib/venues';

interface EventModalProps {
  event: Event | null;
  onClose: () => void;
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

export function EventModal({ event, onClose }: EventModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (event) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [event]);

  const tag = event?.tag && isEventTagSlug(event.tag) ? EVENT_TAGS[event.tag] : null;
  const venue = event?.venue && isVenueSlug(event.venue) ? VENUES[event.venue] : null;

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Sheet — bottom on mobile, centered on md+ */}
          <motion.div
            key="modal"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto"
          >
            {/* Close button */}
            <div className="sticky top-0 bg-white pt-4 px-6 pb-2 flex justify-end border-b border-border">
              <button
                onClick={onClose}
                className="font-inter text-2xl font-bold text-black hover:opacity-60 transition-opacity leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-6 pt-4">
              {/* Venue + tag chips row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {venue && (
                  <span
                    className="inline-block font-inter text-xs uppercase tracking-widest px-3 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: venue.color, color: 'white' }}
                  >
                    {venue.name}
                  </span>
                )}
                {tag && (
                  <span
                    className="inline-block font-inter text-xs uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ backgroundColor: tag.hex, color: tag.textColor }}
                  >
                    {tag.label}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="font-inter font-black text-2xl uppercase text-black leading-tight mb-4">
                {event.title}
              </h2>

              {/* Date & time */}
              <div className="mb-3">
                <p className="font-inter font-medium text-sm text-black">
                  {formatDateLong(event.start_time)}
                </p>
                <p className="font-inter text-sm text-text-muted">
                  {formatTime(event.start_time)}
                  {event.end_time && ` – ${formatTime(event.end_time)}`}
                </p>
              </div>

              {/* Location */}
              {event.location && (
                <p className="font-inter text-sm text-text-muted mb-4">
                  📍 {event.location}
                </p>
              )}

              {/* Description */}
              {event.description && (
                <p className="font-inter text-sm text-text-secondary mb-5 whitespace-pre-line leading-relaxed">
                  {event.description}
                </p>
              )}

              {/* Performers */}
              {event.performers.length > 0 && (
                <div className="mb-5">
                  <p className="font-inter font-medium text-xs uppercase tracking-widest text-text-muted mb-2">
                    Artists
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {event.performers.map(artist => (
                      <a
                        key={artist.id}
                        href={`/discover/${artist.slug}`}
                        className="font-inter text-sm font-medium text-black border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                      >
                        {artist.name}
                        {artist.instagram_handle && (
                          <span className="text-text-muted font-normal ml-1">
                            {artist.instagram_handle.startsWith('@')
                              ? artist.instagram_handle
                              : `@${artist.instagram_handle}`}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket CTA */}
              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    pushEvent('ticket_link_click', {
                      event_title: event.title,
                      event_venue: event.venue ?? '',
                      link_url: event.ticket_url!,
                    });
                    pushEvent('outbound_link_click', {
                      link_url: event.ticket_url,
                      link_text: 'Get Tickets',
                      link_category: 'ticket',
                    });
                  }}
                  className="block w-full text-center font-inter font-bold text-sm uppercase tracking-widest text-white py-4 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#FF8C00' }}
                >
                  Get Tickets
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
