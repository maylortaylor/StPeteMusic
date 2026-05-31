'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { TagInput } from '@/components/ui/tag-input';
import { ImageUploadField } from '@/components/image-upload-field';

const artistSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other']),
  slug: z.string().optional(),
  username: z.string().optional(),
  description: z.string().optional(),
  instagram_handle: z.string().optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
  facebook_url: z.string().url().optional().or(z.literal('')),
  youtube_url: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  linktree_url: z.string().url().optional().or(z.literal('')),
  home_base: z.string().optional(),
  hero_photo_url: z.string().url().optional().or(z.literal('')),
  genres: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
  visible_on_website: z.boolean().default(false),
});

type ArtistFormData = z.infer<typeof artistSchema>;

interface ArtistFormProps {
  artistId?: string;
}

const inputClass =
  'mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

const labelClass = 'block text-sm font-medium text-foreground';

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
    if (artistId) {
      async function fetchArtist() {
        try {
          const response = await fetch(`/api/artists/${artistId}`);
          if (!response.ok) throw new Error('Failed to fetch artist');
          const data = await response.json();
          const nullToEmpty = (v: unknown) => (v === null ? '' : v);
          setFormData({
            name: data.name ?? '',
            type: data.type ?? 'Band',
            slug: nullToEmpty(data.slug) as string,
            username: nullToEmpty(data.username) as string,
            description: nullToEmpty(data.description) as string,
            instagram_handle: nullToEmpty(data.instagram_handle) as string,
            instagram_url: nullToEmpty(data.instagram_url) as string,
            facebook_url: nullToEmpty(data.facebook_url) as string,
            youtube_url: nullToEmpty(data.youtube_url) as string,
            website: nullToEmpty(data.website) as string,
            linktree_url: nullToEmpty(data.linktree_url) as string,
            home_base: nullToEmpty(data.home_base) as string,
            hero_photo_url: nullToEmpty(data.hero_photo_url) as string,
            notes: nullToEmpty(data.notes) as string,
            is_active: data.is_active ?? true,
            visible_on_website: data.visible_on_website ?? false,
            genres: Array.isArray(data.genres) ? data.genres : [],
            tags: Array.isArray(data.tags) ? data.tags : [],
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      }
      fetchArtist();
    }
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

      const payload = {
        ...validation.data,
        slug: validation.data.slug || validation.data.name.toLowerCase().replace(/\s+/g, '-'),
      };

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

      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="font-medium text-foreground">Social Media & Links</h3>
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
            <label className={labelClass}>YouTube URL</label>
            <input
              type="url"
              name="youtube_url"
              value={formData.youtube_url || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://youtube.com/..."
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

          <div>
            <label className={labelClass}>Linktree URL</label>
            <input
              type="url"
              name="linktree_url"
              value={formData.linktree_url || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://linktree.com/..."
            />
          </div>
        </div>
      </div>

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
