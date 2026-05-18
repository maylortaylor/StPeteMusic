'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { toast } from '@/lib/toast';

const VENUE_LABELS: Record<string, string> = {
  'suite-e-studios': 'Suite E Studios',
  'blueberry-patch': 'Blueberry Patch',
  'cage-brewing': 'Cage Brewing',
  'rubys-elixir': "Ruby's Elixir",
  'the-bends': 'The Bends',
};

const TAG_LABELS: Record<string, string> = {
  'live-band': 'Live Band',
  'dj-dance': 'DJ / Dance Night',
  'open-mic': 'Open Mic',
  'community-jam': 'Community Jam',
  'community-event': 'Community Event',
  'workshop-class': 'Workshop / Class',
};

interface AdminEvent {
  id: string;
  google_event_id: string | null;
  title: string;
  start_time: string;
  end_time: string | null;
  venue: string | null;
  tag: string | null;
  location: string | null;
  ticket_url: string | null;
  is_active: boolean;
  performer_count: number;
}

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function prevMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return monthKey(d);
}

function nextMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  return monthKey(d);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

export default function EventsPage() {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [venueFilter, setVenueFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (venueFilter) params.set('venue', venueFilter);
      if (tagFilter) params.set('tag', tagFilter);

      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [month, venueFilter, tagFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Events</h1>
        <p className="mt-1 text-muted-foreground">View and manage synced events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month navigation */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
          <button
            onClick={() => setMonth(prevMonth(month))}
            className="rounded p-1 hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium">{monthLabel(month)}</span>
          <button
            onClick={() => setMonth(nextMonth(month))}
            className="rounded p-1 hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Venue filter */}
        <select
          value={venueFilter}
          onChange={e => setVenueFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Venues</option>
          {Object.entries(VENUE_LABELS).map(([slug, label]) => (
            <option key={slug} value={slug}>{label}</option>
          ))}
        </select>

        {/* Tag filter */}
        <select
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Tags</option>
          {Object.entries(TAG_LABELS).map(([slug, label]) => (
            <option key={slug} value={slug}>{label}</option>
          ))}
        </select>

        <span className="ml-auto text-sm text-muted-foreground">
          {loading ? 'Loading…' : `${events.length} event${events.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date / Time (ET)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Venue</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tag</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Artists</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Ticket</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No events for {monthLabel(month)}
                </td>
              </tr>
            ) : (
              events.map(event => (
                <tr key={event.id} className={`border-b border-border hover:bg-muted/50 ${!event.is_active ? 'opacity-50' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {formatDateTime(event.start_time)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground">{event.location}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {VENUE_LABELS[event.venue ?? ''] ?? event.venue ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {TAG_LABELS[event.tag ?? ''] ?? event.tag ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {event.performer_count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {event.ticket_url ? (
                      <Ticket className="mx-auto h-4 w-4 text-green-600" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        disabled={deletingId === event.id}
                        className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
