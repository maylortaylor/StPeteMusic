'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

const venueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  capacity: z.coerce.number().optional(),
  av_setup: z.string().optional(),
  tags: z.string().optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
  instagram_username: z.string().optional(),
  facebook_url: z.string().url().optional().or(z.literal('')),
  facebook_username: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  facebook_page_id: z.string().optional(),
  instagram_page_id: z.string().optional(),
  google_calendar_id: z.string().optional(),
  partnership_level: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  hero_photo_url: z.string().url().optional().or(z.literal('')),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
  visible_on_website: z.boolean().default(false),
});

type VenueFormData = z.infer<typeof venueSchema>;

interface ExtraLink {
  label: string;
  url: string;
}

interface EventSource {
  type: 'facebook' | 'website' | 'instagram';
  url: string;
}

interface VenueFormProps {
  venueId?: string;
}

const inputClass =
  'mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

const labelClass = 'block text-sm font-medium text-foreground';

export function VenueForm({ venueId }: VenueFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!venueId);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraLinks, setExtraLinks] = useState<ExtraLink[]>([]);
  const [eventsSources, setEventsSources] = useState<EventSource[]>([]);

  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    is_active: true,
    visible_on_website: false,
  });

  useEffect(() => {
    if (venueId) {
      async function fetchVenue() {
        try {
          const response = await fetch(`/api/venues/${venueId}`);
          if (!response.ok) throw new Error('Failed to fetch venue');
          const data = await response.json();
          const nullToEmpty = (v: unknown) => (v === null ? '' : v);
          setFormData({
            name: data.name ?? '',
            slug: nullToEmpty(data.slug) as string,
            description: nullToEmpty(data.description) as string,
            address: nullToEmpty(data.address) as string,
            neighborhood: nullToEmpty(data.neighborhood) as string,
            capacity: data.capacity ?? undefined,
            av_setup: nullToEmpty(data.av_setup) as string,
            tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
            instagram_url: nullToEmpty(data.instagram_url) as string,
            instagram_username: nullToEmpty(data.instagram_username) as string,
            facebook_url: nullToEmpty(data.facebook_url) as string,
            facebook_username: nullToEmpty(data.facebook_username) as string,
            website: nullToEmpty(data.website) as string,
            facebook_page_id: nullToEmpty(data.facebook_page_id) as string,
            instagram_page_id: nullToEmpty(data.instagram_page_id) as string,
            google_calendar_id: nullToEmpty(data.google_calendar_id) as string,
            partnership_level: nullToEmpty(data.partnership_level) as string,
            contact_name: nullToEmpty(data.contact_name) as string,
            phone: nullToEmpty(data.phone) as string,
            email: nullToEmpty(data.email) as string,
            hero_photo_url: nullToEmpty(data.hero_photo_url) as string,
            lat: data.lat != null ? parseFloat(data.lat) : undefined,
            lng: data.lng != null ? parseFloat(data.lng) : undefined,
            notes: nullToEmpty(data.notes) as string,
            is_active: data.is_active ?? true,
            visible_on_website: data.visible_on_website ?? false,
          });
          setExtraLinks(Array.isArray(data.extra_links) ? data.extra_links : []);
          setEventsSources(Array.isArray(data.events_sources) ? data.events_sources : []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      }
      fetchVenue();
    }
  }, [venueId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const validation = venueSchema.safeParse(formData);
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        return;
      }

      const payload = {
        ...validation.data,
        slug: validation.data.slug || validation.data.name.toLowerCase().replace(/\s+/g, '-'),
        tags: validation.data.tags
          ? validation.data.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        extra_links: extraLinks,
        events_sources: eventsSources,
      };

      const url = venueId ? `/api/venues/${venueId}` : '/api/venues';
      const method = venueId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save venue');
      }

      toast.success(venueId ? 'Venue updated' : 'Venue created');
      router.push('/dashboard/venues');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    if (!venueId) return;
    setSyncing(true);
    try {
      const response = await fetch(`/api/venues/${venueId}/sync`, { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Sync failed');
      }
      toast.success('Sync triggered — n8n is fetching venue data');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-border bg-card p-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* ── Basic Info ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Venue name"
          />
        </div>

        <div>
          <label className={labelClass}>Slug</label>
          <input
            type="text"
            name="slug"
            value={formData.slug || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="auto-generated-from-name"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className={inputClass}
            placeholder="Tell us about this venue..."
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="123 Central Ave, St. Pete, FL"
          />
        </div>

        <div>
          <label className={labelClass}>Neighborhood</label>
          <input
            type="text"
            name="neighborhood"
            value={formData.neighborhood || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="Downtown, Grand Central, etc."
          />
        </div>

        <div>
          <label className={labelClass}>Capacity</label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity ?? ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="300"
            min={0}
          />
        </div>

        <div>
          <label className={labelClass}>A/V Setup</label>
          <input
            type="text"
            name="av_setup"
            value={formData.av_setup || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="Full PA, house sound, backline"
          />
        </div>

        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="Live Music, Bar, All Ages"
          />
        </div>
      </div>

      {/* ── Social Media & Links ── */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="font-medium text-foreground">Social Media & Links</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelClass}>Instagram URL</label>
            <input
              type="url"
              name="instagram_url"
              value={formData.instagram_url || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className={labelClass}>Instagram Username</label>
            <input
              type="text"
              name="instagram_username"
              value={formData.instagram_username || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="@handle"
            />
          </div>

          <div>
            <label className={labelClass}>Facebook URL</label>
            <input
              type="url"
              name="facebook_url"
              value={formData.facebook_url || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://facebook.com/..."
            />
          </div>

          <div>
            <label className={labelClass}>Facebook Username</label>
            <input
              type="text"
              name="facebook_username"
              value={formData.facebook_username || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="page-name"
            />
          </div>

          <div>
            <label className={labelClass}>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* ── Platform IDs ── */}
      <div className="space-y-4 border-t border-border pt-6">
        <div>
          <h3 className="font-medium text-foreground">Platform IDs</h3>
          <p className="mt-1 text-xs text-muted-foreground">Used by n8n automation to query APIs directly.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelClass}>Facebook Page ID</label>
            <input
              type="text"
              name="facebook_page_id"
              value={formData.facebook_page_id || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="Numeric ID for Graph API"
            />
          </div>

          <div>
            <label className={labelClass}>Instagram Page ID</label>
            <input
              type="text"
              name="instagram_page_id"
              value={formData.instagram_page_id || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="Numeric account ID for Graph API"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Google Calendar ID</label>
            <input
              type="text"
              name="google_calendar_id"
              value={formData.google_calendar_id || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="abc123...@group.calendar.google.com"
            />
          </div>
        </div>
      </div>

      {/* ── Event Sources ── */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">Event Sources</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Sources n8n scrapes to auto-populate this venue&apos;s events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEventsSources(prev => [...prev, { type: 'facebook', url: '' }])}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Plus className="h-3 w-3" />
            Add source
          </button>
        </div>
        <div className="space-y-2">
          {eventsSources.map((source, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={source.type}
                onChange={e =>
                  setEventsSources(prev =>
                    prev.map((s, idx) =>
                      idx === i ? { ...s, type: e.target.value as EventSource['type'] } : s,
                    ),
                  )
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="website">Website</option>
              </select>
              <input
                type="url"
                value={source.url}
                onChange={e =>
                  setEventsSources(prev =>
                    prev.map((s, idx) => (idx === i ? { ...s, url: e.target.value } : s)),
                  )
                }
                placeholder="https://..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setEventsSources(prev => prev.filter((_, idx) => idx !== i))}
                className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-red-500"
                aria-label="Remove source"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {eventsSources.length === 0 && (
            <p className="text-sm text-muted-foreground">No sources configured.</p>
          )}
        </div>
      </div>

      {/* ── Partnership & Contact ── */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="font-medium text-foreground">Partnership & Contact</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelClass}>Partnership Level</label>
            <input
              type="text"
              name="partnership_level"
              value={formData.partnership_level || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="Partner, Sponsor, etc."
            />
          </div>

          <div>
            <label className={labelClass}>Contact Name</label>
            <input
              type="text"
              name="contact_name"
              value={formData.contact_name || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="Booking contact"
            />
          </div>

          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="(727) 555-0100"
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="booking@venue.com"
            />
          </div>
        </div>
      </div>

      {/* ── Extra Links ── */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">Extra Links</h3>
          <button
            type="button"
            onClick={() => setExtraLinks(prev => [...prev, { label: '', url: '' }])}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Plus className="h-3 w-3" />
            Add link
          </button>
        </div>
        <div className="space-y-2">
          {extraLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={link.label}
                onChange={e =>
                  setExtraLinks(prev =>
                    prev.map((l, idx) => (idx === i ? { ...l, label: e.target.value } : l)),
                  )
                }
                placeholder="Label"
                className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="url"
                value={link.url}
                onChange={e =>
                  setExtraLinks(prev =>
                    prev.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l)),
                  )
                }
                placeholder="https://..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setExtraLinks(prev => prev.filter((_, idx) => idx !== i))}
                className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-red-500"
                aria-label="Remove link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {extraLinks.length === 0 && (
            <p className="text-sm text-muted-foreground">No extra links.</p>
          )}
        </div>
      </div>

      {/* ── Media & Location ── */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="font-medium text-foreground">Media & Location</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>Hero Photo URL</label>
            <input
              type="url"
              name="hero_photo_url"
              value={formData.hero_photo_url || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className={labelClass}>Latitude</label>
            <input
              type="number"
              name="lat"
              value={formData.lat ?? ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="27.7731"
              step="any"
            />
          </div>

          <div>
            <label className={labelClass}>Longitude</label>
            <input
              type="number"
              name="lng"
              value={formData.lng ?? ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="-82.6400"
              step="any"
            />
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="border-t border-border pt-6">
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className={`${inputClass} mt-2`}
          placeholder="Internal notes..."
        />
      </div>

      {/* ── Visibility & Status ── */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="font-medium text-foreground">Visibility & Status</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm font-medium text-foreground">Active</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="visible_on_website"
              checked={formData.visible_on_website}
              onChange={handleChange}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm font-medium text-foreground">Show on public site</span>
          </label>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : venueId ? 'Update Venue' : 'Create Venue'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/venues')}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
        {venueId && (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || eventsSources.length === 0}
            title={eventsSources.length === 0 ? 'Add event sources first' : 'Trigger n8n scrape'}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync venue data'}
          </button>
        )}
      </div>
    </form>
  );
}
