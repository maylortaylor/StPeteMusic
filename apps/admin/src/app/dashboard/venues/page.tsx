'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Venue {
  id: string;
  name: string;
  address?: string;
  capacity?: number;
  is_active: boolean;
  visible_on_website: boolean;
  events_sources: { type: string; url: string }[];
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVenues() {
      try {
        const response = await fetch('/api/venues');
        if (!response.ok) throw new Error('Failed to fetch venues');
        const data = await response.json();
        setVenues(data.venues || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchVenues();
  }, []);

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/venues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentValue }),
      });

      if (!response.ok) throw new Error('Failed to update venue');

      setVenues(venues.map(v => (v.id === id ? { ...v, is_active: !currentValue } : v)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const response = await fetch(`/api/venues/${id}/sync`, { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Sync failed');
      }
      toast.success('Sync triggered — n8n is fetching venue data');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Venues</h1>
          <p className="mt-1 text-muted-foreground">Manage performance venues and locations</p>
        </div>
        <Link
          href="/dashboard/venues/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Venue
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Public</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {venues.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No venues yet
                </td>
              </tr>
            ) : (
              venues.map(venue => (
                <tr key={venue.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{venue.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{venue.address || '—'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{venue.capacity ?? '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleToggleActive(venue.id, venue.is_active)}
                      className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        venue.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {venue.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        venue.visible_on_website
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {venue.visible_on_website ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/venues/${venue.id}`}
                        className="text-primary hover:text-primary/80"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleSync(venue.id)}
                        disabled={syncingId === venue.id || venue.events_sources.length === 0}
                        title={
                          venue.events_sources.length === 0
                            ? 'Add event sources in the venue editor first'
                            : 'Trigger n8n scrape'
                        }
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${syncingId === venue.id ? 'animate-spin' : ''}`}
                        />
                        Sync
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
