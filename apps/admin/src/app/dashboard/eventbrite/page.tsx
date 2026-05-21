'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from '@/lib/toast';

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
};

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
      const res = await fetch('/api/eventbrite/revalidate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Cache refresh failed');
      toast.success('/tickets cache refreshed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cache refresh failed');
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
            {refreshingCache ? 'Refreshing…' : 'Refresh Cache'}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
