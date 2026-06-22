'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from '@/lib/toast';
import { toDatetimeLocal, easternToUtcIso } from '@/lib/eastern-time';

type EbEventRow = {
  eventbrite_id: string;
  name: string;
  status: string | null;
  start_utc: string | null;
  venue_name: string | null;
  quantity_sold: number | null;
  quantity_total: number | null;
  gross_revenue_cents: number | null;
  url: string | null;
  linked_event_id: string | null;
  synced_at: string | null;
  visible_on_tickets: boolean;
};

const ACTIVE_STATUSES = new Set(['live', 'started']);

type Stats = Record<string, number>;

const STATUS_STYLES: Record<string, string> = {
  live:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  started:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ended:     'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  canceled:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  draft:     'bg-muted text-muted-foreground',
  postponed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'draft';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s] ?? STATUS_STYLES.draft}`}>
      {s}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatUSD(cents: number | null) {
  if (cents === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function fillPct(sold: number | null, total: number | null) {
  if (!sold || !total) return '—';
  return `${Math.round((sold / total) * 100)}%`;
}

type FeaturedEvent = {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  image_url: string | null;
  ticket_url: string | null;
  source: string | null;
};

type GcalSearchResult = {
  id: string;
  title: string;
  start_time: string;
  venue: string | null;
};

const FB_MANUAL_FORM_DEFAULTS = {
  title: '',
  start_time: '',
  end_time: '',
  location: '',
  image_url: '',
  ticket_url: '',
};

export default function EventbritePage() {
  const [events, setEvents] = useState<EbEventRow[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [total, setTotal] = useState(0);
  const [activeOnly, setActiveOnly] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ name: string; status: string | null } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [refreshingCache, setRefreshingCache] = useState(false);

  // Other Tickets Page Events (Facebook, Google Calendar, etc.)
  const [featured, setFeatured] = useState<FeaturedEvent[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const [fbUrl, setFbUrl] = useState('');
  const [fbImporting, setFbImporting] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [fbNeedsManualEntry, setFbNeedsManualEntry] = useState<{ url: string } | null>(null);
  const [fbManualForm, setFbManualForm] = useState(FB_MANUAL_FORM_DEFAULTS);
  const [fbManualSaving, setFbManualSaving] = useState(false);

  const [gcalSearch, setGcalSearch] = useState('');
  const [gcalResults, setGcalResults] = useState<GcalSearchResult[]>([]);
  const [gcalSearching, setGcalSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (activeOnly) {
      params.set('status', 'live,started');
    } else if (statusFilter) {
      params.set('status', statusFilter);
    }
    const res = await fetch(`/api/eventbrite/events?${params}`);
    const data = await res.json();
    setEvents(data.events ?? []);
    setStats(data.stats ?? {});
    setTotal(data.total ?? 0);
    if (data.events?.length > 0) {
      const latest = data.events.reduce(
        (best: EbEventRow, e: EbEventRow) =>
          !best.synced_at || (e.synced_at && e.synced_at > best.synced_at) ? e : best,
        data.events[0],
      );
      setLastSynced(latest.synced_at);
    }
    setLoading(false);
  }, [activeOnly, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const fetchFeatured = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const res = await fetch('/api/events?show_on_tickets=true');
      const data = await res.json();
      // Eventbrite-sourced rows are already represented in the table above
      // (linked via eventbrite_events) — don't list them twice here.
      setFeatured((data.events ?? []).filter((e: FeaturedEvent) => e.source !== 'eventbrite'));
    } catch {
      toast.error('Failed to load tickets-page events');
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeatured(); }, [fetchFeatured]);

  const importFacebookEvent = async () => {
    setFbImporting(true);
    setFbError(null);
    setFbNeedsManualEntry(null);
    try {
      const res = await fetch('/api/events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fbUrl, showOnTickets: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');

      if (data.needsManualEntry) {
        setFbNeedsManualEntry({ url: data.url });
        return;
      }

      toast.success(`Added "${data.name}" to /tickets`);
      setFbUrl('');
      await fetchFeatured();
    } catch (err) {
      setFbError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setFbImporting(false);
    }
  };

  const cancelFbManualEntry = () => {
    setFbNeedsManualEntry(null);
    setFbManualForm(FB_MANUAL_FORM_DEFAULTS);
  };

  const saveFbManualEntry = async () => {
    if (!fbNeedsManualEntry || !fbManualForm.title || !fbManualForm.start_time) return;
    setFbManualSaving(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fbManualForm.title,
          start_time: easternToUtcIso(fbManualForm.start_time),
          end_time: fbManualForm.end_time ? easternToUtcIso(fbManualForm.end_time) : undefined,
          location: fbManualForm.location || undefined,
          image_url: fbManualForm.image_url || undefined,
          ticket_url: fbManualForm.ticket_url || undefined,
          source: 'facebook',
          show_on_tickets: true,
          extra_data: { source: 'facebook', fb_event_url: fbNeedsManualEntry.url },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');

      toast.success(`Added "${fbManualForm.title}" to /tickets`);
      setFbUrl('');
      cancelFbManualEntry();
      await fetchFeatured();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setFbManualSaving(false);
    }
  };

  const searchGcalEvents = async () => {
    if (!gcalSearch.trim()) { setGcalResults([]); return; }
    setGcalSearching(true);
    try {
      const res = await fetch(`/api/events?source=google&q=${encodeURIComponent(gcalSearch)}`);
      const data = await res.json();
      setGcalResults(data.events ?? []);
    } catch {
      toast.error('Search failed');
    } finally {
      setGcalSearching(false);
    }
  };

  const addGcalEventToTickets = async (eventId: string, title: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_on_tickets: true }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Added "${title}" to /tickets`);
      setGcalSearch('');
      setGcalResults([]);
      await fetchFeatured();
    } catch {
      toast.error('Failed to add event to /tickets');
    }
  };

  const updateFeaturedField = async (id: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch {
      toast.error('Failed to save change');
    }
  };

  const removeFromTickets = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_on_tickets: false }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Removed "${title}" from /tickets`);
      setFeatured(prev => prev.filter(e => e.id !== id));
    } catch {
      toast.error('Failed to remove from /tickets');
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/eventbrite/events/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      toast.success(`Synced ${data.synced} events — ${data.added} added, ${data.updated} updated`);
      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} event(s) had errors during sync`);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const refreshCache = async () => {
    setRefreshingCache(true);
    try {
      // Sync first so DB statuses are current, then bust the web cache
      const syncRes = await fetch('/api/eventbrite/events/sync', { method: 'POST' });
      const syncData = await syncRes.json();
      if (!syncRes.ok) throw new Error(syncData.error ?? 'Sync failed');

      const revalidateRes = await fetch('/api/eventbrite/revalidate', { method: 'POST' });
      const revalidateData = await revalidateRes.json();
      if (!revalidateRes.ok) throw new Error(revalidateData.error ?? 'Cache refresh failed');

      toast.success(`Synced ${syncData.synced} events — /tickets cache refreshed`);
      if (syncData.errors?.length > 0) {
        toast.warning(`${syncData.errors.length} event(s) had errors during sync`);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync & refresh failed');
    } finally {
      setRefreshingCache(false);
    }
  };

  const importEvent = async () => {
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const res = await fetch('/api/eventbrite/events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      setImportResult({ name: data.name, status: data.status });
      setImportUrl('');
      await load();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const setEnded = async (eventbriteId: string, name: string) => {
    try {
      const res = await fetch(`/api/eventbrite/events/${eventbriteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Update failed');
      toast.success(`"${name}" marked as ended`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const totalSold = Object.entries(stats).reduce((s) => s, 0);
  const totalRevenue = events.reduce((s, e) => s + (e.gross_revenue_cents ?? 0), 0);
  const linked = events.filter((e) => e.linked_event_id).length;

  const STATUS_TABS = ['live', 'started', 'ended', 'completed', 'canceled', 'draft'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eventbrite</h1>
          {lastSynced && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last synced {new Date(lastSynced).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshCache}
            disabled={refreshingCache}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {refreshingCache ? 'Syncing & Refreshing…' : 'Sync & Refresh Cache'}
          </button>
          <button
            onClick={sync}
            disabled={syncing}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync Events'}
          </button>
        </div>
      </div>

      {/* Import external event */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Import External Event</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add an event from another org&apos;s Eventbrite page
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => { setImportUrl(e.target.value); setImportResult(null); setImportError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && importUrl && !importing) importEvent(); }}
            placeholder="https://www.eventbrite.com/e/..."
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
            ✓ Imported: &ldquo;{importResult.name}&rdquo;
            {importResult.status ? ` (${importResult.status})` : ''}
          </p>
        )}
        {importError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">✗ {importError}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Events', value: Object.values(stats).reduce((s, n) => s + n, 0) },
          { label: 'Live / Active', value: (stats['live'] ?? 0) + (stats['started'] ?? 0) },
          { label: 'Linked to DB', value: linked },
          { label: 'Total Revenue', value: formatUSD(totalRevenue || null) },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-card p-4">
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => {
              setActiveOnly(e.target.checked);
              if (e.target.checked) setStatusFilter('');
            }}
            className="rounded"
          />
          Active only (live / started)
        </label>

        {!activeOnly && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setStatusFilter('')}
              className={`rounded px-2 py-1 text-xs font-medium ${statusFilter === '' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              All ({total})
            </button>
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded px-2 py-1 text-xs font-medium ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {s} ({stats[s] ?? 0})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading…</div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-muted-foreground">
          <p className="font-medium">No events found</p>
          <p className="text-sm mt-1">Click &ldquo;Sync Events&rdquo; to pull from Eventbrite</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground" title="Visible on /tickets right now">On Site</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Venue</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cap.</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Sold</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Fill</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Revenue</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Linked</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event) => (
                <tr key={event.eventbrite_id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium max-w-[220px] truncate" title={event.name}>
                    <Link
                      href={`/dashboard/eventbrite/${event.eventbrite_id}`}
                      className="hover:underline text-primary"
                    >
                      {event.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {formatDate(event.start_utc)}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-3 py-2 text-center" title={event.visible_on_tickets ? 'Visible on /tickets' : 'Not shown on /tickets'}>
                    {event.visible_on_tickets
                      ? <span className="text-green-600 dark:text-green-400">✓</span>
                      : <span className="text-muted-foreground">–</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[120px] truncate" title={event.venue_name ?? ''}>
                    {event.venue_name ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {event.quantity_total ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {event.quantity_sold ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {fillPct(event.quantity_sold, event.quantity_total)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {formatUSD(event.gross_revenue_cents)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {event.linked_event_id ? '✓ linked' : '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          EB ↗
                        </a>
                      )}
                      <Link
                        href={`/dashboard/eventbrite/${event.eventbrite_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Details →
                      </Link>
                      {ACTIVE_STATUSES.has(event.status ?? '') && (
                        <button
                          onClick={() => setEnded(event.eventbrite_id, event.name)}
                          className="text-xs text-amber-600 hover:underline dark:text-amber-400"
                        >
                          Mark Ended
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Other Tickets Page Events */}
      <div className="space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-lg font-bold">Other Tickets Page Events</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Events shown on /tickets that aren&apos;t synced from your Eventbrite org — Facebook,
            Google Calendar, or other event links. More sources coming soon.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Add via Facebook URL */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">Add a Facebook Event</h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={fbUrl}
                onChange={(e) => { setFbUrl(e.target.value); setFbError(null); setFbNeedsManualEntry(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && fbUrl && !fbImporting) importFacebookEvent(); }}
                placeholder="https://www.facebook.com/events/…"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={importFacebookEvent}
                disabled={fbImporting || !fbUrl.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
              >
                {fbImporting ? 'Adding…' : 'Add →'}
              </button>
            </div>
            {fbError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">✗ {fbError}</p>}

            {fbNeedsManualEntry && (
              <div className="mt-3 rounded-md border border-border bg-muted/30 p-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Couldn&apos;t auto-fetch details from Facebook — fill in what you know.
                </p>
                <input
                  type="text"
                  value={fbManualForm.title}
                  onChange={(e) => setFbManualForm({ ...fbManualForm, title: e.target.value })}
                  placeholder="Title *"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="datetime-local"
                    value={fbManualForm.start_time}
                    onChange={(e) => setFbManualForm({ ...fbManualForm, start_time: e.target.value })}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="datetime-local"
                    value={fbManualForm.end_time}
                    onChange={(e) => setFbManualForm({ ...fbManualForm, end_time: e.target.value })}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <input
                  type="text"
                  value={fbManualForm.location}
                  onChange={(e) => setFbManualForm({ ...fbManualForm, location: e.target.value })}
                  placeholder="Location"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="url"
                    value={fbManualForm.image_url}
                    onChange={(e) => setFbManualForm({ ...fbManualForm, image_url: e.target.value })}
                    placeholder="Image URL"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="url"
                    value={fbManualForm.ticket_url}
                    onChange={(e) => setFbManualForm({ ...fbManualForm, ticket_url: e.target.value })}
                    placeholder="Ticket URL"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveFbManualEntry}
                    disabled={fbManualSaving || !fbManualForm.title || !fbManualForm.start_time}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {fbManualSaving ? 'Saving…' : 'Save Event'}
                  </button>
                  <button
                    onClick={cancelFbManualEntry}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add from Google Calendar */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">Add from Google Calendar</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Search events already synced from the St Pete Music calendar.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={gcalSearch}
                onChange={(e) => setGcalSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && gcalSearch && !gcalSearching) searchGcalEvents(); }}
                placeholder="Search calendar events…"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={searchGcalEvents}
                disabled={gcalSearching || !gcalSearch.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
              >
                {gcalSearching ? 'Searching…' : 'Search'}
              </button>
            </div>
            {gcalResults.length > 0 && (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border divide-y divide-border">
                {gcalResults.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="truncate">
                      {r.title}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(r.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </span>
                    <button
                      onClick={() => addGcalEventToTickets(r.id, r.title)}
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                    >
                      Add →
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Table of current tickets-page entries */}
        {featuredLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : featured.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-8 text-center text-muted-foreground text-sm">
            No Facebook or Google Calendar events on /tickets yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Source</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date/Time (ET)</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Location</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Image URL</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Ticket URL</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {featured.map((ev) => (
                  <tr key={ev.id}>
                    <td className="px-3 py-2 text-xs text-muted-foreground capitalize whitespace-nowrap">
                      {ev.source ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        defaultValue={ev.title}
                        onBlur={(e) => updateFeaturedField(ev.id, 'title', e.target.value)}
                        className="w-full min-w-[140px] rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-input focus:border-input focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="datetime-local"
                        defaultValue={toDatetimeLocal(ev.start_time)}
                        onBlur={(e) => e.target.value && updateFeaturedField(ev.id, 'start_time', easternToUtcIso(e.target.value))}
                        className="rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-input focus:border-input focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        defaultValue={ev.location ?? ''}
                        onBlur={(e) => updateFeaturedField(ev.id, 'location', e.target.value)}
                        className="w-full min-w-[120px] rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-input focus:border-input focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="url"
                        defaultValue={ev.image_url ?? ''}
                        onBlur={(e) => updateFeaturedField(ev.id, 'image_url', e.target.value)}
                        className="w-full min-w-[140px] rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-input focus:border-input focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="url"
                        defaultValue={ev.ticket_url ?? ''}
                        onBlur={(e) => updateFeaturedField(ev.id, 'ticket_url', e.target.value)}
                        className="w-full min-w-[140px] rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-input focus:border-input focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => removeFromTickets(ev.id, ev.title)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove from /tickets
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
