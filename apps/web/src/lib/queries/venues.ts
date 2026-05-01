import { query } from '@/lib/db';
import type { Venue } from '@stpetemusic/types';

export async function getAllVenues(): Promise<Venue[]> {
  return query<Venue>(`
    SELECT
      id, name, slug, address, capacity, tags,
      instagram_url, instagram_username, facebook_url,
      website, lat, lng, is_active
    FROM venues
    WHERE is_active = true AND slug IS NOT NULL
    ORDER BY name ASC
  `);
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const rows = await query<Venue>(`
    SELECT
      id, name, slug, description, address, phone, email,
      capacity, tags, instagram_url, instagram_username,
      facebook_url, facebook_username, website,
      hero_photo_url, lat, lng, extra_links, is_active
    FROM venues
    WHERE slug = $1 AND is_active = true
    LIMIT 1
  `, [slug]);
  return rows[0] ?? null;
}

export async function getAllVenueSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(`
    SELECT slug FROM venues WHERE is_active = true AND slug IS NOT NULL
  `);
  return rows.map(r => r.slug);
}
