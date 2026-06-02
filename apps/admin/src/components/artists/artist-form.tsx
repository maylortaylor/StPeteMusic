'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ChevronDown, ChevronUp, ExternalLink, Star, Trash2 } from 'lucide-react';
import type { ArtistLink } from '@stpetemusic/types';
import { toast } from '@/lib/toast';
import { TagInput } from '@/components/ui/tag-input';
import { ImageUploadField } from '@/components/image-upload-field';
import { PlatformIcon } from '@/components/platform-icon';
import { canSetFeatured, KNOWN_PLATFORMS } from '@/lib/artist-links';

const artistSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other']),
  slug: z.string().optional(),
  username: z.string().optional(),
  description: z.string().optional(),
  instagram_handle: z.string().optional(),
  home_base: z.string().optional(),
  hero_photo_url: z.string().url().optional().or(z.literal('')),
  genres: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
  visible_on_website: z.boolean().default(false),
});

type ArtistFormData = z.infer<typeof artistSchema>;

type StagedLink = ArtistLink & { _tempId?: string };

interface ArtistFormProps {
  artistId?: string;
}

const inputClass =
  'mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

const labelClass = 'block text-sm font-medium text-foreground';

const MAX_LINKS = 10;

export function ArtistForm({ artistId }: ArtistFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!artistId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState<ArtistFormData>({
    name: '',
    type: 'Band',
    genres: [],
    tags: [],
    is_active: true,
    visible_on_website: false,
  });

  // Links state (edit mode only)
  const [links, setLinks] = useState<StagedLink[]>([]);
  const [addPlatform, setAddPlatform] = useState('website');
  const [addUrl, setAddUrl] = useState('');
  const [addLabel, setAddLabel] = useState('Website');

  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setGenreSuggestions((data.artistGenres ?? []).map((e: { value: string }) => e.value));
        setTagSuggestions((data.artistTags ?? []).map((e: { value: string }) => e.value));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!artistId) return;

    async function fetchAll() {
      try {
        const [artistRes, linksRes] = await Promise.all([
          fetch(`/api/artists/${artistId}`),
          fetch(`/api/artists/${artistId}/links`),
        ]);
        if (!artistRes.ok) throw new Error('Failed to fetch artist');
        const data = await artistRes.json();
        const linksData = linksRes.ok ? await linksRes.json() : { links: [] };

        const nullToEmpty = (v: unknown) => (v === null ? '' : v);
        setFormData({
          name: data.name ?? '',
          type: data.type ?? 'Band',
          slug: nullToEmpty(data.slug) as string,
          username: nullToEmpty(data.username) as string,
          description: nullToEmpty(data.description) as string,
          instagram_handle: nullToEmpty(data.instagram_handle) as string,
          home_base: nullToEmpty(data.home_base) as string,
          hero_photo_url: nullToEmpty(data.hero_photo_url) as string,
          notes: nullToEmpty(data.notes) as string,
          is_active: data.is_active ?? true,
          visible_on_website: data.visible_on_website ?? false,
          genres: Array.isArray(data.genres) ? data.genres : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
        });
        setLinks(linksData.links ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [artistId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  // Links operations (all local until Save)
  function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!addUrl || !addLabel) return;
    if (links.length >= MAX_LINKS) return;
    const tempLink: StagedLink = {
      id: '',
      _tempId: crypto.randomUUID(),
      artist_id: artistId ?? '',
      platform: addPlatform,
      url: addUrl,
      label: addLabel,
      display_order: links.length,
      is_active: true,
      is_featured: false,
      created_at: '',
      updated_at: '',
    };
    setLinks(prev => [...prev, tempLink]);
    setAddUrl('');
    setAddLabel(KNOWN_PLATFORMS.find(p => p.value === addPlatform)?.label ?? 'Website');
  }

  function handleDeleteLink(index: number) {
    setLinks(prev => prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, display_order: i })));
  }

  function handleMoveLink(index: number, direction: 'up' | 'down') {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= links.length) return;
    const next = [...links];
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    setLinks(next.map((l, i) => ({ ...l, display_order: i })));
  }

  function handleToggleFeatured(index: number) {
    const link = links[index];
    if (!link.is_featured && !canSetFeatured(links)) {
      alert('Maximum 3 featured links. Remove a starred link first.');
      return;
    }
    setLinks(prev => prev.map((l, i) => i === index ? { ...l, is_featured: !l.is_featured } : l));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const validation = artistSchema.safeParse(formData);
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        return;
      }

      const values = validation.data;

      // Force "@" prefix on username and instagram_handle
      if (values.username && !values.username.startsWith('@')) {
        values.username = '@' + values.username;
      }
      if (values.instagram_handle && !values.instagram_handle.startsWith('@')) {
        values.instagram_handle = '@' + values.instagram_handle;
      }

      const payload: Record<string, unknown> = {
        ...values,
        slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-'),
      };

      if (artistId) {
        payload.links = links.map((l, i) => ({
          id: l.id || undefined,
          platform: l.platform,
          url: l.url,
          label: l.label,
          display_order: i,
          is_featured: l.is_featured,
        }));
      }

      const url = artistId ? `/api/artists/${artistId}` : '/api/artists';
      const method = artistId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save artist');
      }

      toast.success(artistId ? 'Artist updated' : 'Artist created');
      router.push('/dashboard/artists');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-border bg-card p-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

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
            placeholder="Artist name"
          />
        </div>

        <div>
          <label className={labelClass}>Type *</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="Band">Band</option>
            <option value="Solo Artist">Solo Artist</option>
            <option value="DJ">DJ</option>
            <option value="Event Producer">Event Producer</option>
            <option value="Creative">Creative</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="@username"
          />
        </div>

        <div>
          <label className={labelClass}>Home Base</label>
          <input
            type="text"
            name="home_base"
            value={formData.home_base || ''}
            onChange={handleChange}
            className={inputClass}
            placeholder="St. Pete, FL"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={4}
          className={inputClass}
          placeholder="Tell us about this artist..."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={labelClass}>Genres</label>
          <TagInput
            value={formData.genres ?? []}
            onChange={(genres) => setFormData((prev) => ({ ...prev, genres }))}
            placeholder="Hip-Hop, Electronic, Rock…"
            suggestions={genreSuggestions}
          />
        </div>

        <div>
          <label className={labelClass}>Tags</label>
          <TagInput
            value={formData.tags ?? []}
            onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
            placeholder="Local, Featured, Rising…"
            suggestions={tagSuggestions}
          />
        </div>
      </div>

      {/* Social Handles */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="font-medium text-foreground">Social Handles</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelClass}>Instagram Handle</label>
            <input
              type="text"
              name="instagram_handle"
              value={formData.instagram_handle || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="@handle"
            />
          </div>
        </div>
      </div>

      {/* Links (edit mode only) */}
      {artistId && (
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Links</h3>
            <span className="text-xs text-muted-foreground">{links.length} / {MAX_LINKS}</span>
          </div>

          {links.length === 0 && (
            <p className="text-sm text-muted-foreground">No links yet. Add one below.</p>
          )}

          <ul className="space-y-2">
            {links.map((link, idx) => (
              <li
                key={link.id || link._tempId}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <PlatformIcon platform={link.platform} size={16} showExternalIndicator={false} />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{link.label}</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {link.url.length > 50 ? link.url.slice(0, 50) + '…' : link.url}
                    <ExternalLink size={10} />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFeatured(idx)}
                  title={
                    link.is_featured
                      ? 'Remove from featured'
                      : canSetFeatured(links)
                        ? 'Feature this link (max 3)'
                        : 'Remove a starred link first (max 3)'
                  }
                  className="text-amber-400 hover:text-amber-500"
                >
                  <Star size={16} fill={link.is_featured ? 'currentColor' : 'none'} />
                </button>

                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveLink(idx, 'up')}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === links.length - 1}
                    onClick={() => handleMoveLink(idx, 'down')}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteLink(idx)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>

          {links.length < MAX_LINKS ? (
            <form onSubmit={handleAddLink} className="flex flex-wrap gap-3 border-t border-border pt-4">
              <select
                value={addPlatform}
                onChange={(e) => {
                  setAddPlatform(e.target.value);
                  const p = KNOWN_PLATFORMS.find((p) => p.value === e.target.value);
                  if (p) setAddLabel(p.label);
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {KNOWN_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <input
                type="url"
                placeholder="https://..."
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                required
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Label"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                required
                className="w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add
              </button>
            </form>
          ) : (
            <p className="border-t border-border pt-4 text-xs text-muted-foreground">
              Maximum {MAX_LINKS} links reached.
            </p>
          )}
        </div>
      )}

      {artistId && (
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="font-medium text-foreground">Hero Photo</h3>
          <ImageUploadField
            value={formData.hero_photo_url ?? ''}
            artistId={artistId}
            onChange={(url) => setFormData((prev) => ({ ...prev, hero_photo_url: url }))}
          />
        </div>
      )}

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
            <span className="text-sm font-medium text-foreground">Visible on Website</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 border-t border-border pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : artistId ? 'Update Artist' : 'Create Artist'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/artists')}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
