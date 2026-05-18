'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, RefreshCw, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

interface FeaturedArtist {
  id: string;
  artist_id: string;
  featured_month: string;
  order_position: number;
  status: string;
  artist_name: string | null;
  artist_type: string | null;
  artist_instagram_handle: string | null;
  artist_instagram_url: string | null;
  artist_facebook_url: string | null;
  artist_linktree_url: string | null;
  artist_website: string | null;
  artist_bandcamp_url: string | null;
}

interface Artist {
  id: string;
  name: string;
  type: string;
}

interface FeaturedVenue {
  id: string;
  venue_id: string;
  featured_month: string;
  event_id: string | null;
  callout_text: string | null;
  status: string;
  venue_name: string | null;
  venue_slug: string | null;
  venue_instagram_url: string | null;
  venue_instagram_username: string | null;
  venue_website: string | null;
  event_title: string | null;
  event_start_time: string | null;
  event_ticket_url: string | null;
}

interface Venue {
  id: string;
  name: string;
}

interface EventItem {
  id: string;
  title: string;
  start_time: string;
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
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [featured, setFeatured] = useState<FeaturedArtist[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [enrichingArtist, setEnrichingArtist] = useState<FeaturedArtist | null>(null);
  const [extraUrls, setExtraUrls] = useState<string[]>([]);
  const [extraUrlInput, setExtraUrlInput] = useState('');
  const [newSlot, setNewSlot] = useState<{ position: number; artistId: string }>({ position: 0, artistId: '' });

  const [featuredVenue, setFeaturedVenue] = useState<FeaturedVenue | null>(null);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueEvents, setVenueEvents] = useState<EventItem[]>([]);
  const [venueForm, setVenueForm] = useState({ venueId: '', eventId: '', calloutText: '', status: 'draft' });
  const [venueEditing, setVenueEditing] = useState(false);
  const [venueSaving, setVenueSaving] = useState(false);

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

  const fetchFeaturedVenue = useCallback(async () => {
    try {
      const res = await fetch(`/api/featured-venues?month=${month}`);
      if (!res.ok) throw new Error('Failed to fetch featured venue');
      const data = await res.json();
      setFeaturedVenue(data.featured_venue ?? null);
      if (data.featured_venue) {
        setVenueForm({
          venueId: data.featured_venue.venue_id,
          eventId: data.featured_venue.event_id ?? '',
          calloutText: data.featured_venue.callout_text ?? '',
          status: data.featured_venue.status,
        });
      } else {
        setVenueForm({ venueId: '', eventId: '', calloutText: '', status: 'draft' });
        setVenueEditing(false);
      }
    } catch {
      // non-fatal — venue spotlight is optional
    }
  }, [month]);

  useEffect(() => {
    fetchFeatured();
    fetchFeaturedVenue();
  }, [fetchFeatured, fetchFeaturedVenue]);

  useEffect(() => {
    fetch('/api/artists')
      .then((r) => { if (!r.ok) throw new Error(`Failed to load artists (${r.status})`); return r.json(); })
      .then((d) => setAllArtists(d.artists || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load artist list'));
    fetch('/api/venues')
      .then((r) => r.json())
      .then((d) => setAllVenues((d.venues || []).map((v: { id: string; name: string }) => ({ id: v.id, name: v.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/events?month=${month}`)
      .then((r) => r.json())
      .then((d) => setVenueEvents(d.events || []))
      .catch(() => {});
  }, [month]);

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

  const handleSaveVenue = async () => {
    if (!venueForm.venueId) return;
    setVenueSaving(true);
    try {
      const body = {
        venueId: venueForm.venueId,
        eventId: venueForm.eventId || null,
        calloutText: venueForm.calloutText || null,
        status: venueForm.status,
      };
      const res = featuredVenue
        ? await fetch(`/api/featured-venues/${featuredVenue.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/featured-venues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, featuredMonth: month }),
          });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save venue spotlight');
      }
      setVenueEditing(false);
      fetchFeaturedVenue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save venue spotlight');
    } finally {
      setVenueSaving(false);
    }
  };

  const handleDeleteVenue = async () => {
    if (!featuredVenue || !confirm('Remove venue spotlight for this month?')) return;
    try {
      const res = await fetch(`/api/featured-venues/${featuredVenue.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      setFeaturedVenue(null);
      setVenueForm({ venueId: '', eventId: '', calloutText: '', status: 'draft' });
      setVenueEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove venue spotlight');
    }
  };

  const openEnrichPanel = (artist: FeaturedArtist) => {
    setEnrichingArtist(artist);
    setExtraUrls([]);
    setExtraUrlInput('');
  };

  const closeEnrichPanel = () => {
    setEnrichingArtist(null);
    setExtraUrls([]);
    setExtraUrlInput('');
  };

  const addExtraUrl = () => {
    const url = extraUrlInput.trim();
    if (url && !extraUrls.includes(url)) {
      setExtraUrls((prev) => [...prev, url]);
    }
    setExtraUrlInput('');
  };

  const handleTriggerEnrich = async (id: string, urls: string[]) => {
    setTriggering(id);
    setError(null);
    try {
      const res = await fetch(`/api/featured/${id}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraUrls: urls }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to trigger enrichment');
      }
      closeEnrichPanel();
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
              onClick={() => openEnrichPanel(artist)}
              disabled={!!triggering}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
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

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Venue Spotlight</h2>
          </div>
          <div className="flex gap-2">
            {featuredVenue && !venueEditing && (
              <>
                <button
                  onClick={() => setVenueEditing(true)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteVenue}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {!featuredVenue && !venueEditing ? (
          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
            <p className="mb-3 text-sm text-muted-foreground">No venue spotlight set for {formatMonth(month)}</p>
            <button
              onClick={() => setVenueEditing(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              <MapPin className="h-4 w-4" />
              Add Venue Spotlight
            </button>
          </div>
        ) : featuredVenue && !venueEditing ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Venue</p>
              <p className="text-base font-semibold text-foreground">{featuredVenue.venue_name}</p>
              {featuredVenue.venue_instagram_username && (
                <p className="text-sm text-muted-foreground">{featuredVenue.venue_instagram_username}</p>
              )}
            </div>
            {featuredVenue.event_title && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Featured Event</p>
                <p className="text-sm text-foreground">{featuredVenue.event_title}</p>
                {featuredVenue.event_start_time && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(featuredVenue.event_start_time).toLocaleDateString('en-US', {
                      timeZone: 'America/New_York',
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}
            {featuredVenue.callout_text && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Callout</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{featuredVenue.callout_text}</p>
              </div>
            )}
            <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${
              featuredVenue.status === 'approved'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {featuredVenue.status === 'approved' ? 'Approved' : 'Draft'}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Venue</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={venueForm.venueId}
                onChange={(e) => setVenueForm((f) => ({ ...f, venueId: e.target.value }))}
              >
                <option value="">Select a venue...</option>
                {allVenues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Featured Event <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={venueForm.eventId}
                onChange={(e) => setVenueForm((f) => ({ ...f, eventId: e.target.value }))}
              >
                <option value="">No specific event</option>
                {venueEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} — {new Date(ev.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Callout Text <span className="text-muted-foreground font-normal">(manually written)</span>
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                placeholder="Write 3–4 sentences about this venue and why readers should check out the event..."
                value={venueForm.calloutText}
                onChange={(e) => setVenueForm((f) => ({ ...f, calloutText: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={venueForm.status}
                onChange={(e) => setVenueForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveVenue}
                disabled={!venueForm.venueId || venueSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {venueSaving ? 'Saving...' : 'Save Venue Spotlight'}
              </button>
              <button
                onClick={() => {
                  setVenueEditing(false);
                  if (!featuredVenue) setVenueForm({ venueId: '', eventId: '', calloutText: '', status: 'draft' });
                }}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {enrichingArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border bg-muted/40 px-6 py-4 rounded-t-xl">
              <p className="font-semibold text-foreground">Start Enrichment — {enrichingArtist.artist_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sources that will be scraped by n8n</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                { label: 'Instagram', url: enrichingArtist.artist_instagram_url },
                { label: 'Facebook', url: enrichingArtist.artist_facebook_url },
                { label: 'Linktree', url: enrichingArtist.artist_linktree_url },
                { label: 'Website', url: enrichingArtist.artist_website },
                { label: 'Bandcamp', url: enrichingArtist.artist_bandcamp_url },
              ].map(({ label, url }) => url ? (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-xs font-medium text-muted-foreground">{label}</span>
                  <span className="truncate text-foreground">{url}</span>
                </div>
              ) : null)}

              {extraUrls.map((url) => (
                <div key={url} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-xs font-medium text-muted-foreground">Extra</span>
                  <span className="flex-1 truncate text-foreground">{url}</span>
                  <button
                    onClick={() => setExtraUrls((prev) => prev.filter((u) => u !== url))}
                    className="text-muted-foreground hover:text-destructive text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <input
                  type="url"
                  value={extraUrlInput}
                  onChange={(e) => setExtraUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtraUrl(); } }}
                  placeholder="Add extra URL…"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={addExtraUrl}
                  disabled={!extraUrlInput.trim()}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <button
                onClick={closeEnrichPanel}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTriggerEnrich(enrichingArtist.id, extraUrls)}
                disabled={triggering === enrichingArtist.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {triggering === enrichingArtist.id && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Confirm & Send to n8n
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
