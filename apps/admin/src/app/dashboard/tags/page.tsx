'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

type TagType = 'artistGenre' | 'artistTag' | 'eventType' | 'venueTag';

interface TagEntry {
  value: string;
  count: number;
}

interface TagData {
  artistGenres: TagEntry[];
  artistTags: TagEntry[];
  eventTypes: TagEntry[];
  venueTags: TagEntry[];
}

const TABS: { key: TagType; label: string }[] = [
  { key: 'artistGenre', label: 'Artist Genres' },
  { key: 'artistTag',   label: 'Artist Tags' },
  { key: 'eventType',   label: 'Event Types' },
  { key: 'venueTag',    label: 'Venue Tags' },
];

function TagList({
  type,
  entries,
  onRefresh,
}: {
  type: TagType;
  entries: TagEntry[];
  onRefresh: () => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const startRename = (value: string) => {
    setRenaming(value);
    setRenameValue(value);
  };

  const cancelRename = () => { setRenaming(null); setRenameValue(''); };

  const submitRename = async (from: string) => {
    const to = renameValue.trim();
    if (!to || to === from) { cancelRename(); return; }
    setBusy(from);
    try {
      const res = await fetch('/api/tags/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, from, to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(`Renamed "${from}" → "${to}" across ${data.updated} records`);
      cancelRename();
      onRefresh();
    } catch {
      toast.error('Failed to rename tag');
    } finally {
      setBusy(null);
    }
  };

  const deleteTag = async (value: string) => {
    if (!confirm(`Delete "${value}" from all records? This cannot be undone.`)) return;
    setBusy(value);
    try {
      const res = await fetch('/api/tags/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, from: value, to: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(`Deleted "${value}" from ${data.updated} records`);
      onRefresh();
    } catch {
      toast.error('Failed to delete tag');
    } finally {
      setBusy(null);
    }
  };

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No values found in the database.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Value</th>
            <th className="px-4 py-3 font-medium">Records</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const isBusy = busy === entry.value;
            const isRenaming = renaming === entry.value;
            return (
              <tr
                key={entry.value}
                className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
              >
                <td className="px-4 py-3">
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(entry.value);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <span className="font-medium text-foreground">{entry.value}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{entry.count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {isRenaming ? (
                      <>
                        <button
                          onClick={() => submitRename(entry.value)}
                          disabled={isBusy}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isBusy ? '…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelRename}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startRename(entry.value)}
                          disabled={isBusy}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deleteTag(entry.value)}
                          disabled={isBusy}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
                        >
                          {isBusy ? '…' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TagsPage() {
  const [activeTab, setActiveTab] = useState<TagType>('artistGenre');
  const [data, setData] = useState<TagData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tags');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const activeEntries: TagEntry[] = data
    ? (activeTab === 'artistGenre' ? data.artistGenres
      : activeTab === 'artistTag' ? data.artistTags
      : activeTab === 'eventType' ? data.eventTypes
      : data.venueTags)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tags & Genres</h1>
        <p className="mt-1 text-muted-foreground">
          View, rename, and merge free-text taxonomy values across artists, events, and venues.
          Renaming to an existing value merges them.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {data && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({(activeTab === tab.key ? activeEntries : (
                  tab.key === 'artistGenre' ? data.artistGenres
                  : tab.key === 'artistTag' ? data.artistTags
                  : tab.key === 'eventType' ? data.eventTypes
                  : data.venueTags
                )).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : (
        <TagList type={activeTab} entries={activeEntries} onRefresh={fetchTags} />
      )}
    </div>
  );
}
