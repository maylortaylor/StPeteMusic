'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedArtist {
  id: string;
  artist_id: string;
  featured_month: string;
  order_position: number;
  status: string;
  artist_name: string | null;
  artist_type: string | null;
  artist_instagram_handle: string | null;
}

interface Artist {
  id: string;
  name: string;
  type: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; action?: string; actionPath?: string }> = {
  pending_enrichment: { label: 'Pending', color: 'bg-muted text-muted-foreground', action: 'Start Enrichment', actionPath: 'enrich' },
  enrichment_ready: { label: 'Ready to Review', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', action: 'Review Data', actionPath: 'enrichment' },
  enrichment_failed: { label: 'Enrichment Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', action: 'Retry Enrichment', actionPath: 'enrichment' },
  enrichment_approved: { label: 'Enriched', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', action: 'Generate Newsletter Blurb', actionPath: 'newsletter' },
  newsletter_generated: { label: 'Blurb Draft Ready', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', action: 'Review Blurb', actionPath: 'newsletter' },
  newsletter_approved: { label: 'Newsletter Approved', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', action: 'Generate Blog Post', actionPath: 'blog' },
  blog_generated: { label: 'Blog Draft Ready', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', action: 'Review Blog Post', actionPath: 'blog' },
  blog_approved: { label: 'Complete ✓', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

function formatMonth(ym: string) {
  const [year, month] = ym.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

function offsetMonth(ym: string, delta: number): string {
  const [year, month] = ym.split('-').map(Number);
  const d = new Date(year, month - 1 + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function FeaturedPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [featured, setFeatured] = useState<FeaturedArtist[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<{ position: number; artistId: string }>({ position: 0, artistId: '' });

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/featured?month=${month}`);
      if (!res.ok) throw new Error('Failed to fetch featured artists');
      const data = await res.json();
      setFeatured(data.featured || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  useEffect(() => {
    fetch('/api/artists')
      .then((r) => r.json())
      .then((d) => setAllArtists(d.artists || []))
      .catch(() => {});
  }, []);

  const handleAddSlot = async (position: number) => {
    if (!newSlot.artistId || newSlot.position !== position) return;
    setError(null);
    try {
      const res = await fetch('/api/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: newSlot.artistId, featuredMonth: month, orderPosition: position }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to add artist');
      }
      setNewSlot({ position: 0, artistId: '' });
      fetchFeatured();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleTriggerEnrich = async (id: string) => {
    setTriggering(id);
    setError(null);
    try {
      const res = await fetch(`/api/featured/${id}/enrich`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to trigger enrichment');
      }
      fetchFeatured();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setTriggering(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this artist from featured?')) return;
    try {
      const res = await fetch(`/api/featured/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to remove');
      }
      fetchFeatured();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filledSlots = new Set(featured.map((f) => f.order_position));

  const renderSlot = (position: number) => {
    const artist = featured.find((f) => f.order_position === position);
    const statusConfig = artist ? STATUS_LABELS[artist.status] ?? STATUS_LABELS['pending_enrichment'] : null;

    if (!artist) {
      const isEditing = newSlot.position === position;
      return (
        <div className="rounded-lg border-2 border-dashed border-border bg-card p-6">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Featured #{position} — Empty</p>
          {isEditing ? (
            <div className="flex gap-2">
              <select
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={newSlot.artistId}
                onChange={(e) => setNewSlot({ position, artistId: e.target.value })}
              >
                <option value="">Select an artist...</option>
                {allArtists
                  .filter((a) => !featured.some((f) => f.artist_id === a.id))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
              </select>
              <button
                onClick={() => handleAddSlot(position)}
                disabled={!newSlot.artistId}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setNewSlot({ position: 0, artistId: '' })}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setNewSlot({ position, artistId: '' })}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              <Star className="h-4 w-4" />
              Select Artist
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Featured #{position}</p>
          {artist.status === 'pending_enrichment' && (
            <button
              onClick={() => handleRemove(artist.id)}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          )}
        </div>

        <h3 className="text-lg font-semibold text-foreground">{artist.artist_name}</h3>
        <p className="text-sm text-muted-foreground">{artist.artist_type}</p>
        {artist.artist_instagram_handle && (
          <p className="text-sm text-muted-foreground">@{artist.artist_instagram_handle}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${statusConfig?.color}`}>
            {statusConfig?.label}
          </span>

          {statusConfig?.action && statusConfig.actionPath === 'enrich' ? (
            <button
              onClick={() => handleTriggerEnrich(artist.id)}
              disabled={triggering === artist.id}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {triggering === artist.id ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : null}
              {statusConfig.action}
            </button>
          ) : statusConfig?.action && statusConfig.actionPath ? (
            <Link
              href={`/dashboard/featured/${artist.id}/${statusConfig.actionPath}`}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {statusConfig.action}
            </Link>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Featured Artists</h1>
          <p className="mt-1 text-muted-foreground">Monthly artist spotlight pipeline</p>
        </div>
        <button
          onClick={fetchFeatured}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setMonth((m) => offsetMonth(m, -1))}
          className="rounded-md border border-border p-1.5 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-40 text-center text-lg font-semibold text-foreground">
          {formatMonth(month)}
        </span>
        <button
          onClick={() => setMonth((m) => offsetMonth(m, 1))}
          className="rounded-md border border-border p-1.5 hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {renderSlot(1)}
          {renderSlot(2)}
        </div>
      )}
    </div>
  );
}
