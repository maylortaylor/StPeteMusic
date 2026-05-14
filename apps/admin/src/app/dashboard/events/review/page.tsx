'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PendingEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  venue: string | null;
  tag: string | null;
  ticket_url: string | null;
  image_url: string | null;
  source: string | null;
  extra_data: Record<string, unknown>;
  performer_count: number;
}

function formatET(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventsReviewPage() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/events?review_status=pending');
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      toast.error('Failed to load pending events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const approve = async (id: string) => {
    setProcessing((p) => new Set(p).add(id));
    try {
      const res = await fetch(`/api/events/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Event approved and published');
    } catch {
      toast.error('Failed to approve event');
    } finally {
      setProcessing((p) => { const n = new Set(p); n.delete(id); return n; });
    }
  };

  const reject = async (id: string) => {
    setProcessing((p) => new Set(p).add(id));
    try {
      const res = await fetch(`/api/events/${id}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Event rejected');
    } catch {
      toast.error('Failed to reject event');
    } finally {
      setProcessing((p) => { const n = new Set(p); n.delete(id); return n; });
    }
  };

  const approveAll = async () => {
    if (events.length === 0) return;
    setBulkProcessing(true);
    let approved = 0;
    let failed = 0;
    await Promise.all(
      events.map(async (e) => {
        try {
          const res = await fetch(`/api/events/${e.id}/approve`, { method: 'POST' });
          if (res.ok) approved++;
          else failed++;
        } catch {
          failed++;
        }
      }),
    );
    setEvents([]);
    setBulkProcessing(false);
    if (failed === 0) toast.success(`Approved all ${approved} events`);
    else toast.warning(`Approved ${approved}, failed ${failed}`);
  };

  const fbUrl = (event: PendingEvent): string | null =>
    (event.extra_data?.fb_event_url as string) ?? null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Event Review Queue</h1>
          <p className="mt-1 text-muted-foreground">Loading pending events…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Event Review Queue</h1>
          <p className="mt-1 text-muted-foreground">
            Scraped events waiting for approval before going live on the site.
          </p>
        </div>
        {events.length > 0 && (
          <button
            onClick={approveAll}
            disabled={bulkProcessing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {bulkProcessing ? 'Approving…' : `Approve All (${events.length})`}
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-medium text-foreground">All caught up!</p>
          <p className="mt-1 text-sm text-muted-foreground">No events pending review.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Date / Time (ET)</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Tag</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Performers</th>
                <th className="px-4 py-3 font-medium">Links</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => {
                const busy = processing.has(event.id);
                const fb = fbUrl(event);
                return (
                  <tr
                    key={event.id}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatET(event.start_time)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                      {event.title}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{event.venue ?? '—'}</td>
                    <td className="px-4 py-3">
                      {event.tag ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {event.tag}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{event.source ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {event.performer_count > 0 ? `${event.performer_count} artist${event.performer_count > 1 ? 's' : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                      {fb && (
                        <a
                          href={fb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                        >
                          Facebook ↗
                        </a>
                      )}
                      {event.ticket_url && (
                        <a
                          href={event.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                        >
                          Tickets ↗
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => approve(event.id)}
                          disabled={busy}
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {busy ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => reject(event.id)}
                          disabled={busy}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                          {busy ? '…' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
