'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { toast } from '@/lib/toast';

type EbTicketClass = {
  id: string;
  name: string;
  isFree: boolean;
  cost: { currency: string; value: number; display: string } | null;
  quantityTotal: number;
  quantitySold: number;
  quantityAvailable: number;
};

type EbEventDetail = {
  eventbrite_id: string;
  name: string;
  description_text: string | null;
  status: string | null;
  start_utc: string | null;
  end_utc: string | null;
  start_timezone: string | null;
  url: string | null;
  logo_url: string | null;
  is_free: boolean;
  capacity: number | null;
  ticket_availability_status: string | null;
  quantity_sold: number | null;
  quantity_total: number | null;
  quantity_available: number | null;
  gross_revenue_cents: number | null;
  net_revenue_cents: number | null;
  fees_cents: number | null;
  report_currency: string | null;
  ticket_classes: EbTicketClass[];
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_region: string | null;
  venue_latitude: string | null;
  venue_longitude: string | null;
  category_name: string | null;
  format_name: string | null;
  organizer_name: string | null;
  linked_event_id: string | null;
  linked_event_title: string | null;
  linked_event_start: string | null;
};

type LocalEvent = { id: string; title: string; start_time: string };

const STATUS_STYLES: Record<string, string> = {
  live:      'bg-green-100 text-green-800',
  started:   'bg-emerald-100 text-emerald-800',
  completed: 'bg-blue-100 text-blue-800',
  ended:     'bg-slate-100 text-slate-700',
  canceled:  'bg-red-100 text-red-800',
  draft:     'bg-muted text-muted-foreground',
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'draft';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s] ?? STATUS_STYLES.draft}`}>
      {s}
    </span>
  );
}

function formatDate(iso: string | null, tz?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZoneName: tz ? undefined : 'short',
  });
}

function formatUSD(cents: number | null) {
  if (cents === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function EventbriteDetailPage({
  params,
}: {
  params: Promise<{ eventbriteId: string }>;
}) {
  const { eventbriteId } = use(params);
  const [event, setEvent] = useState<EbEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/eventbrite/events/${eventbriteId}`)
      .then((r) => r.json())
      .then(setEvent)
      .finally(() => setLoading(false));

    fetch('/api/events?limit=200')
      .then((r) => r.json())
      .then((d) => setLocalEvents(d.events ?? []));
  }, [eventbriteId]);

  const filteredEvents = localEvents.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const linkEvent = async (eventId: string | null) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/eventbrite/events/${eventbriteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linked_event_id: eventId }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(eventId ? 'Event linked' : 'Link removed');
      // Refresh
      const updated = await fetch(`/api/eventbrite/events/${eventbriteId}`).then((r) => r.json());
      setEvent(updated);
    } catch {
      toast.error('Failed to save link');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading…</div>;
  }
  if (!event) {
    return <div className="py-12 text-center text-muted-foreground">Event not found</div>;
  }

  const fillPct =
    event.quantity_sold && event.quantity_total
      ? Math.round((event.quantity_sold / event.quantity_total) * 100)
      : null;

  const mapsUrl =
    event.venue_latitude && event.venue_longitude
      ? `https://www.google.com/maps?q=${event.venue_latitude},${event.venue_longitude}`
      : null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/dashboard/eventbrite" className="text-sm text-muted-foreground hover:underline">
            ← Eventbrite
          </Link>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={event.status} />
            {event.organizer_name && (
              <span className="text-sm text-muted-foreground">by {event.organizer_name}</span>
            )}
          </div>
        </div>
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            View on Eventbrite ↗
          </a>
        )}
      </div>

      {/* Stats panel */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Capacity', value: event.quantity_total ?? event.capacity ?? '—' },
          { label: 'Sold', value: event.quantity_sold ?? '—' },
          { label: 'Fill %', value: fillPct !== null ? `${fillPct}%` : '—' },
          { label: 'Availability', value: event.ticket_availability_status ?? '—' },
          { label: 'Gross Revenue', value: formatUSD(event.gross_revenue_cents) },
          { label: 'Net Revenue', value: formatUSD(event.net_revenue_cents) },
          { label: 'Fees', value: formatUSD(event.fees_cents) },
          { label: 'Free Event', value: event.is_free ? 'Yes' : 'No' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-3">
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Event info */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
        <h2 className="font-semibold text-base mb-3">Event Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Start: </span>
            {formatDate(event.start_utc, event.start_timezone)}
          </div>
          <div>
            <span className="text-muted-foreground">End: </span>
            {formatDate(event.end_utc, event.start_timezone)}
          </div>
          {event.start_timezone && (
            <div>
              <span className="text-muted-foreground">Timezone: </span>
              {event.start_timezone}
            </div>
          )}
          {event.category_name && (
            <div>
              <span className="text-muted-foreground">Category: </span>
              {event.category_name}
            </div>
          )}
          {event.format_name && (
            <div>
              <span className="text-muted-foreground">Format: </span>
              {event.format_name}
            </div>
          )}
        </div>
        {event.venue_name && (
          <div className="mt-2 pt-2 border-t border-border">
            <span className="text-muted-foreground">Venue: </span>
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                {event.venue_name}
                {event.venue_address ? ` — ${event.venue_address}` : ''}
                {' ↗'}
              </a>
            ) : (
              <span>{event.venue_name}{event.venue_address ? ` — ${event.venue_address}` : ''}</span>
            )}
          </div>
        )}
        {event.description_text && (
          <div className="mt-2 pt-2 border-t border-border text-muted-foreground line-clamp-3">
            {event.description_text}
          </div>
        )}
      </div>

      {/* Ticket classes table */}
      {event.ticket_classes?.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <h2 className="font-semibold">Ticket Types</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Price</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Sold</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {event.ticket_classes.map((tc) => (
                <tr key={tc.id}>
                  <td className="px-3 py-2">{tc.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {tc.isFree ? 'Free' : tc.cost?.display ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right">{tc.quantityTotal}</td>
                  <td className="px-3 py-2 text-right">{tc.quantitySold}</td>
                  <td className="px-3 py-2 text-right">{tc.quantityAvailable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Link to DB event */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Link to Local DB Event</h2>
        <p className="text-sm text-muted-foreground">
          Associate this Eventbrite event with a local event in your database. This link is preserved through syncs and enables &ldquo;Buy Tickets&rdquo; CTAs on the events calendar.
        </p>

        {event.linked_event_id && (
          <div className="flex items-center gap-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 text-sm">
            <span className="text-green-700 dark:text-green-300 font-medium">
              Linked: {event.linked_event_title ?? event.linked_event_id}
              {event.linked_event_start && ` (${formatDate(event.linked_event_start, null)})`}
            </span>
            <button
              onClick={() => linkEvent(null)}
              disabled={saving}
              className="ml-auto text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              Unlink
            </button>
          </div>
        )}

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search local events…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && filteredEvents.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background text-sm divide-y divide-border">
              {filteredEvents.slice(0, 20).map((e) => (
                <button
                  key={e.id}
                  onClick={() => { linkEvent(e.id); setSearchQuery(''); }}
                  disabled={saving}
                  className="w-full px-3 py-2 text-left hover:bg-muted disabled:opacity-50"
                >
                  <span className="font-medium">{e.title}</span>
                  <span className="ml-2 text-muted-foreground text-xs">
                    {formatDate(e.start_time, null)}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchQuery && filteredEvents.length === 0 && (
            <p className="text-xs text-muted-foreground px-1">No matching events found</p>
          )}
        </div>
      </div>
    </div>
  );
}
