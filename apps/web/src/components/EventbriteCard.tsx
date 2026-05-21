'use client';

import { useEffect, useRef } from 'react';
import type { EventbriteEventCard } from '@/lib/queries/eventbrite';

declare global {
  interface Window {
    EBWidgets?: {
      createWidget: (options: {
        widgetType: string;
        eventId: string;
        iframeContainerDiv: string;
        onOrderComplete?: () => void;
      }) => void;
    };
  }
}

function formatDate(utc: string, timezone: string | null) {
  try {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone ?? undefined,
    };
    return new Intl.DateTimeFormat('en-US', options).format(new Date(utc));
  } catch {
    return new Date(utc).toLocaleDateString();
  }
}

export function EventbriteCard({ event }: { event: EventbriteEventCard }) {
  const widgetContainerId = `eb-widget-${event.eventbrite_id}`;
  const widgetMounted = useRef(false);

  useEffect(() => {
    if (widgetMounted.current) return;

    const mountWidget = () => {
      if (window.EBWidgets) {
        window.EBWidgets.createWidget({
          widgetType: 'checkout',
          eventId: event.eventbrite_id,
          iframeContainerDiv: widgetContainerId,
        });
        widgetMounted.current = true;
      }
    };

    // Load the Eventbrite widget script if not already present
    if (window.EBWidgets) {
      mountWidget();
    } else {
      const existing = document.querySelector('script[data-eb-widgets]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.eventbrite.com/static/widgets/eb_widgets.js';
        script.async = true;
        script.dataset.ebWidgets = 'true';
        script.onload = mountWidget;
        document.body.appendChild(script);
      } else {
        // Script is loading but not ready yet — poll briefly
        const interval = setInterval(() => {
          if (window.EBWidgets) {
            clearInterval(interval);
            mountWidget();
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }
  }, [event.eventbrite_id, widgetContainerId]);

  const soldOut = event.ticket_availability_status === 'sold_out';
  const unavailable = event.ticket_availability_status === 'unavailable';

  return (
    <div className="relative rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow">
      {/* Stretched link — makes the whole card clickable without nesting <a> inside <a> */}
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-[1] rounded-xl"
          aria-label={`View ${event.name} on Eventbrite`}
        />
      )}

      {/* Image */}
      {event.logo_url && (
        <div className="relative h-44 bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.logo_url}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div>
          <div className="flex items-start gap-2 justify-between">
            <h3 className="font-bold text-lg leading-tight">{event.name}</h3>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {soldOut && (
                <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
                  Sold Out
                </span>
              )}
              {event.is_free && !soldOut && (
                <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                  Free
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(event.start_utc, event.start_timezone)}
          </p>
          {event.venue_name && (
            <p className="text-sm text-muted-foreground">{event.venue_name}</p>
          )}
        </div>

        {/* Eventbrite checkout widget or fallback — lifted above the stretched link */}
        {!soldOut && !unavailable ? (
          <div className="relative z-10 mt-auto">
            <div id={widgetContainerId} className="min-h-[80px]" />
            {/* Fallback CTA shown while widget loads or if it fails */}
            <a
              href={event.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full rounded-lg bg-[#f05537] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#d94a2e] transition-colors"
            >
              Get Tickets →
            </a>
          </div>
        ) : (
          <div className="relative z-10 mt-auto">
            <a
              href={event.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              {soldOut ? 'View Event (Sold Out)' : 'View on Eventbrite'} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
