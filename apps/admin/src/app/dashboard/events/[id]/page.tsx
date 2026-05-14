'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { use } from 'react';

const VENUE_OPTIONS = [
  { value: 'suite-e-studios', label: 'Suite E Studios' },
  { value: 'blueberry-patch', label: 'Blueberry Patch' },
  { value: 'cage-brewing', label: 'Cage Brewing' },
  { value: 'rubys-elixir', label: "Ruby's Elixir" },
  { value: 'the-bends', label: 'The Bends' },
];

const TAG_OPTIONS = [
  { value: 'live-band', label: 'Live Band' },
  { value: 'dj-dance', label: 'DJ / Dance Night' },
  { value: 'open-mic', label: 'Open Mic' },
  { value: 'community-jam', label: 'Community Jam' },
  { value: 'community-event', label: 'Community Event' },
  { value: 'workshop-class', label: 'Workshop / Class' },
];

interface EventDetail {
  id: string;
  google_event_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  tag: string | null;
  ticket_url: string | null;
  venue: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Performer {
  artist_id: string;
  name: string;
  slug: string;
  type: string;
  instagram_handle: string | null;
}

interface ArtistOption {
  id: string;
  name: string;
  type: string;
  instagram_handle: string | null;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const eastern = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${eastern.getFullYear()}-${pad(eastern.getMonth() + 1)}-${pad(eastern.getDate())}T${pad(eastern.getHours())}:${pad(eastern.getMinutes())}`;
}

// Interprets a datetime-local string as Eastern time and returns UTC ISO.
// Uses the sv-SE locale trick to derive the current ET→UTC offset, which handles DST correctly.
function easternToUtcIso(dtLocal: string): string {
  const asUtc = new Date(dtLocal + 'Z');
  const etStr = asUtc.toLocaleString('sv-SE', { timeZone: 'America/New_York' }).replace(' ', 'T');
  const offsetMs = asUtc.getTime() - new Date(etStr + 'Z').getTime();
  return new Date(asUtc.getTime() + offsetMs).toISOString();
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [allArtists, setAllArtists] = useState<ArtistOption[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [addingArtistId, setAddingArtistId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    tag: '',
    ticket_url: '',
    venue: '',
    image_url: '',
    is_active: true,
  });

  const loadData = useCallback(async () => {
    try {
      const [eventRes, performersRes, artistsRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/events/${id}/performers`),
        fetch('/api/artists'),
      ]);

      if (!eventRes.ok) throw new Error('Event not found');

      const eventData: EventDetail = await eventRes.json();
      const { performers: perfData } = await performersRes.json();
      const { artists: artistsData } = await artistsRes.json();

      setEvent(eventData);
      setPerformers(perfData ?? []);
      setAllArtists(artistsData ?? []);

      setForm({
        title: eventData.title,
        description: eventData.description ?? '',
        start_time: toDatetimeLocal(eventData.start_time),
        end_time: toDatetimeLocal(eventData.end_time),
        location: eventData.location ?? '',
        tag: eventData.tag ?? '',
        ticket_url: eventData.ticket_url ?? '',
        venue: eventData.venue ?? '',
        image_url: eventData.image_url ?? '',
        is_active: eventData.is_active,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load event');
      router.push('/dashboard/events');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          start_time: form.start_time ? easternToUtcIso(form.start_time) : undefined,
          end_time: form.end_time ? easternToUtcIso(form.end_time) : null,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success('Event saved');
    } catch {
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPerformer = async () => {
    if (!addingArtistId) return;
    try {
      const res = await fetch(`/api/events/${id}/performers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: addingArtistId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to add performer');
      }
      const artist = allArtists.find(a => a.id === addingArtistId);
      if (artist) {
        setPerformers(prev => [...prev, {
          artist_id: artist.id,
          name: artist.name,
          slug: '',
          type: artist.type,
          instagram_handle: artist.instagram_handle,
        }]);
      }
      setAddingArtistId('');
      setArtistSearch('');
      toast.success('Performer added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add performer');
    }
  };

  const handleRemovePerformer = async (artistId: string, name: string) => {
    try {
      const res = await fetch(`/api/events/${id}/performers/${artistId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Remove failed');
      setPerformers(prev => prev.filter(p => p.artist_id !== artistId));
      toast.success(`Removed ${name}`);
    } catch {
      toast.error('Failed to remove performer');
    }
  };

  const filteredArtists = allArtists.filter(a =>
    !performers.some(p => p.artist_id === a.id) &&
    (artistSearch === '' ||
      a.name.toLowerCase().includes(artistSearch.toLowerCase()) ||
      (a.instagram_handle ?? '').toLowerCase().includes(artistSearch.toLowerCase())),
  );

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading…</div>;
  }

  if (!event) return null;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
          {event.google_event_id && (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              GCal ID: {event.google_event_id}
            </p>
          )}
        </div>
      </div>

      {/* Event fields */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Details</h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Title</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Start (ET)</label>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">End (ET)</label>
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Location</label>
          <input
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Venue</label>
            <select
              value={form.venue}
              onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">— none —</option>
              {VENUE_OPTIONS.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tag</label>
            <select
              value={form.tag}
              onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">— none —</option>
              {TAG_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Ticket URL</label>
          <input
            type="url"
            value={form.ticket_url}
            onChange={e => setForm(f => ({ ...f, ticket_url: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Image URL</label>
          <input
            type="url"
            value={form.image_url}
            onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-foreground">
            Active (shown on website)
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link
            href="/dashboard/events"
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Performers section */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Performers</h2>

        {/* Current performers */}
        {performers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No performers linked yet.</p>
        ) : (
          <ul className="space-y-2">
            {performers.map(p => (
              <li key={p.artist_id} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2">
                <div>
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.type}</span>
                  {p.instagram_handle && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.instagram_handle.startsWith('@') ? p.instagram_handle : `@${p.instagram_handle}`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemovePerformer(p.artist_id, p.name)}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                  aria-label={`Remove ${p.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add performer */}
        <div className="flex gap-2 pt-1">
          <div className="relative flex-1">
            <input
              value={artistSearch}
              onChange={e => { setArtistSearch(e.target.value); setAddingArtistId(''); }}
              placeholder="Search artists…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            {artistSearch && filteredArtists.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {filteredArtists.slice(0, 20).map(a => (
                  <li key={a.id}>
                    <button
                      onClick={() => {
                        setAddingArtistId(a.id);
                        setArtistSearch(a.name);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      {a.name}
                      {a.instagram_handle && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {a.instagram_handle.startsWith('@') ? a.instagram_handle : `@${a.instagram_handle}`}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={handleAddPerformer}
            disabled={!addingArtistId}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Read-only metadata */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p><span className="font-medium">Created:</span> {new Date(event.created_at).toLocaleString()}</p>
        <p><span className="font-medium">Updated:</span> {new Date(event.updated_at).toLocaleString()}</p>
      </div>
    </div>
  );
}
