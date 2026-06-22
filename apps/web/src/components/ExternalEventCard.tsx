import type { FeaturedTicketEvent } from '@/lib/queries/tickets-extras';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }).format(new Date(iso));
}

function resolveLinkUrl(event: FeaturedTicketEvent): string | null {
  if (event.ticket_url) return event.ticket_url;
  try {
    const extra = JSON.parse(event.extra_data) as Record<string, unknown>;
    if (typeof extra.fb_event_url === 'string') return extra.fb_event_url;
  } catch {
    // ignore malformed extra_data
  }
  return null;
}

export function ExternalEventCard({ event }: { event: FeaturedTicketEvent }) {
  const linkUrl = resolveLinkUrl(event);

  return (
    <div className="relative rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-[1] rounded-xl"
          aria-label={`View ${event.title}`}
        />
      )}

      {event.image_url && (
        <div className="relative h-44 bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-bold text-lg leading-tight">{event.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(event.start_time)}</p>
          {event.location && <p className="text-sm text-muted-foreground">{event.location}</p>}
        </div>

        {linkUrl && (
          <div className="relative z-10 mt-auto">
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-[#f05537] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#d94a2e] transition-colors"
            >
              {event.ticket_url ? 'Get Tickets' : 'View Event'} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
