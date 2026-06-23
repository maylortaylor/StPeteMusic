'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { toast } from '@/lib/toast';
import { buildManualEntryPayload } from '@/lib/manual-entry';
import { importEventViaApi } from '@/lib/import-event';
import { DateHourRangeFields } from '@/components/DateHourRangeFields';

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

type NeedsManualEntry = { url: string; fbEventId: string };

const MANUAL_FORM_DEFAULTS = {
  title: '',
  start_time: '',
  end_time: '',
  location: '',
  image_url: '',
  ticket_url: '',
};

export default function EventsPage() {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [venueFilter, setVenueFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add Event from Link
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ name: string; source: string } | null>(null);
  const [needsManualEntry, setNeedsManualEntry] = useState<NeedsManualEntry | null>(null);
  const [manualForm, setManualForm] = useState(MANUAL_FORM_DEFAULTS);
  const [manualSaving, setManualSaving] = useState(false);

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

  const importEvent = async () => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    setNeedsManualEntry(null);
    try {
      const data = await importEventViaApi(importUrl);

      if (data.needsManualEntry) {
        setNeedsManualEntry({ url: data.url ?? importUrl, fbEventId: data.fbEventId ?? '' });
        return;
      }

      setImportResult({ name: data.name ?? '', source: data.source ?? '' });
      setImportUrl('');
      await fetchEvents();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const cancelManualEntry = () => {
    setNeedsManualEntry(null);
    setManualForm(MANUAL_FORM_DEFAULTS);
  };

  const saveManualEntry = async () => {
    if (!needsManualEntry || !manualForm.title || !manualForm.start_time) return;
    setManualSaving(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildManualEntryPayload(manualForm, needsManualEntry.url)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');

      toast.success(`Added "${manualForm.title}"`);
      setImportUrl('');
      cancelManualEntry();
      await fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Events</h1>
        <p className="mt-1 text-muted-foreground">View and manage synced events</p>
      </div>

      {/* Add Event from Link */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Add Event from Link</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add an event from Eventbrite or Facebook — more sources coming soon
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => {
              setImportUrl(e.target.value);
              setImportResult(null);
              setImportError(null);
              setNeedsManualEntry(null);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && importUrl && !importing) importEvent(); }}
            placeholder="Paste an Eventbrite or Facebook event link…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={importEvent}
            disabled={importing || !importUrl.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
          >
            {importing ? 'Importing…' : 'Import →'}
          </button>
        </div>
        {importResult && (
          <p className="mt-2 text-xs text-green-700 dark:text-green-400">
            ✓ Added &ldquo;{importResult.name}&rdquo; ({importResult.source})
          </p>
        )}
        {importError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">✗ {importError}</p>
        )}

        {needsManualEntry && (
          <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Couldn&apos;t auto-fetch details from Facebook for this event — fill in what you
              know and we&apos;ll save it with a link back to the original post.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={manualForm.title}
                onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                placeholder="Title *"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <DateHourRangeFields
                  startValue={manualForm.start_time}
                  endValue={manualForm.end_time}
                  onStartChange={(value) => setManualForm((prev) => ({ ...prev, start_time: value }))}
                  onEndChange={(value) => setManualForm((prev) => ({ ...prev, end_time: value }))}
                />
              </div>
              <input
                type="text"
                value={manualForm.location}
                onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                placeholder="Location"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                type="url"
                value={manualForm.image_url}
                onChange={(e) => setManualForm({ ...manualForm, image_url: e.target.value })}
                placeholder="Image URL"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                type="url"
                value={manualForm.ticket_url}
                onChange={(e) => setManualForm({ ...manualForm, ticket_url: e.target.value })}
                placeholder="Ticket URL"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveManualEntry}
                disabled={manualSaving || !manualForm.title || !manualForm.start_time}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {manualSaving ? 'Saving…' : 'Save Event'}
              </button>
              <button
                onClick={cancelManualEntry}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
