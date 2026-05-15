'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

type VideoRow = {
  video_id: string;
  title: string | null;
  proposed_title: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  status: string | null;
  calendar_match_confidence: string | null;
  is_livestream: boolean | null;
  is_short: boolean | null;
};

type Stats = Record<string, number>;

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Needs Timestamps', value: 'needs_timestamps' },
  { label: 'Approved', value: 'approved' },
  { label: 'Published', value: 'published' },
  { label: 'Skipped', value: 'skipped' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  needs_timestamps: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  skipped: 'bg-muted text-muted-foreground',
};

const CONFIDENCE_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  guessed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  none: 'bg-muted text-muted-foreground',
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'pending_review';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s] ?? STATUS_STYLES.skipped}`}>
      {s.replace(/_/g, ' ')}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string | null }) {
  const c = confidence ?? 'none';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[c] ?? CONFIDENCE_STYLES.none}`}>
      {c}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function YouTubeQueuePage() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncCursor, setSyncCursor] = useState<string | undefined>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('yt_sync_cursor') ?? undefined : undefined,
  );
  const [syncPlaylistId, setSyncPlaylistId] = useState<string | undefined>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('yt_sync_playlist_id') ?? undefined : undefined,
  );
  const [syncFetched, setSyncFetched] = useState<number>(() =>
    typeof window !== 'undefined' ? parseInt(localStorage.getItem('yt_sync_fetched') ?? '0', 10) : 0,
  );
  const [syncDone, setSyncDone] = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('yt_sync_done') === 'true' : false,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/youtube/videos?${params}`);
      const data = await res.json();
      setVideos(data.videos ?? []);
      setStats(data.stats ?? {});
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/youtube/videos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchMode: true,
          pageToken: syncCursor,
          uploadsPlaylistId: syncPlaylistId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Sync failed');
        return;
      }
      const count = (data.added ?? 0) + (data.updated ?? 0);
      const newFetched = syncFetched + count;
      const done = !data.hasMore;

      setSyncFetched(newFetched);
      setSyncCursor(data.nextPageToken);
      setSyncPlaylistId(data.uploadsPlaylistId);
      setSyncDone(done);

      if (data.nextPageToken) {
        localStorage.setItem('yt_sync_cursor', data.nextPageToken);
      } else {
        localStorage.removeItem('yt_sync_cursor');
      }
      if (data.uploadsPlaylistId) {
        localStorage.setItem('yt_sync_playlist_id', data.uploadsPlaylistId);
      }
      localStorage.setItem('yt_sync_fetched', String(newFetched));
      localStorage.setItem('yt_sync_done', String(done));

      toast.success(`Imported ${data.added} new, updated ${data.updated}`);
      fetchVideos();
    } catch (err) {
      toast.error(`Sync failed: ${String(err)}`);
    } finally {
      setSyncing(false);
    }
  };

  const resetSync = () => {
    ['yt_sync_cursor', 'yt_sync_playlist_id', 'yt_sync_fetched', 'yt_sync_done'].forEach(
      (k) => localStorage.removeItem(k),
    );
    setSyncCursor(undefined);
    setSyncPlaylistId(undefined);
    setSyncFetched(0);
    setSyncDone(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllConfirmed = () => {
    const ids = videos
      .filter((v) => v.calendar_match_confidence === 'confirmed' && v.status !== 'published' && v.status !== 'approved')
      .map((v) => v.video_id);
    setSelected(new Set(ids));
  };

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkApproving(true);
    try {
      const res = await fetch('/api/youtube/videos/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Approved ${data.approved} videos`);
      setSelected(new Set());
      fetchVideos();
    } catch (err) {
      toast.error(`Bulk approve failed: ${String(err)}`);
    } finally {
      setBulkApproving(false);
    }
  };

  const pendingCount = (stats['pending_review'] ?? 0) + (stats['needs_timestamps'] ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">YouTube Review Queue</h1>
          <p className="mt-1 text-muted-foreground">
            Review and approve video metadata before publishing to YouTube.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={runSync}
            disabled={syncing || syncDone}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {syncing
              ? 'Importing…'
              : syncDone
                ? 'All Videos Imported'
                : syncFetched === 0
                  ? 'Import 25 Videos'
                  : `Import Next 25 (${syncFetched}/544)`}
          </button>
          {(syncFetched > 0 || syncDone) && (
            <button
              onClick={resetSync}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Reset import
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: total },
          { label: 'Pending', value: pendingCount },
          { label: 'Needs Timestamps', value: stats['needs_timestamps'] ?? 0 },
          { label: 'Approved', value: stats['approved'] ?? 0 },
          { label: 'Published', value: stats['published'] ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Bulk actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setSelected(new Set()); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              {f.value === 'pending_review' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <button
              onClick={bulkApprove}
              disabled={bulkApproving}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {bulkApproving ? 'Approving…' : 'Bulk Approve'}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {selected.size === 0 && (
          <button
            onClick={selectAllConfirmed}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Select all Confirmed
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-lg border border-border bg-card px-6 py-16 text-center text-muted-foreground">
          Loading…
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-medium text-foreground">No videos found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run &quot;Sync from YouTube&quot; to import your channel&apos;s videos.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === videos.length && videos.length > 0}
                    onChange={(e) =>
                      setSelected(e.target.checked ? new Set(videos.map((v) => v.video_id)) : new Set())
                    }
                    className="rounded border-border"
                  />
                </th>
                <th className="px-3 py-3 w-16">Thumb</th>
                <th className="px-3 py-3 font-medium">Current Title</th>
                <th className="px-3 py-3 font-medium">Proposed Title</th>
                <th className="px-3 py-3 font-medium">Match</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Uploaded</th>
                <th className="px-3 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video, i) => (
                <tr
                  key={video.video_id}
                  className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(video.video_id)}
                      onChange={() => toggleSelect(video.video_id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {video.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        className="w-14 h-9 rounded object-cover"
                      />
                    ) : (
                      <div className="w-14 h-9 rounded bg-muted" />
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[200px]">
                    <p className="truncate text-muted-foreground text-xs" title={video.title ?? ''}>
                      {video.title ?? '—'}
                    </p>
                    <div className="mt-0.5 flex gap-1">
                      {video.is_livestream && (
                        <span className="rounded bg-red-100 px-1 text-[10px] text-red-700 dark:bg-red-900/40 dark:text-red-300">LIVE</span>
                      )}
                      {video.is_short && (
                        <span className="rounded bg-purple-100 px-1 text-[10px] text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">SHORT</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-[220px]">
                    <p className="truncate font-medium text-foreground text-xs" title={video.proposed_title ?? ''}>
                      {video.proposed_title ?? <span className="italic text-muted-foreground">no proposal</span>}
                    </p>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <ConfidenceBadge confidence={video.calendar_match_confidence} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <StatusBadge status={video.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(video.published_at)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/dashboard/youtube/${video.video_id}`}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Review →
                    </Link>
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
