import { query } from '@/lib/db';
import type { Artist, ArtistLink, ArtistShow } from '@stpetemusic/types';

export async function getAllArtists(): Promise<Artist[]> {
  return query<Artist>(`
    SELECT
      id, name, slug, type, genres, tags,
      instagram_handle, instagram_url, is_active
    FROM artists
    WHERE is_active = true AND visible_on_website = true AND slug IS NOT NULL
    ORDER BY name ASC
  `);
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const rows = await query<Artist>(`
    SELECT
      id, name, slug, type, description, email, hero_photo_url,
      genres, tags, username, instagram_handle, instagram_url,
      facebook_url, youtube_url, bandcamp_url, spotify_url,
      soundcloud_url, linktree_url, website, extra_links, is_active
    FROM artists
    WHERE slug = $1 AND is_active = true
    LIMIT 1
  `, [slug]);
  return rows[0] ?? null;
}

export async function getArtistShows(artistId: string): Promise<ArtistShow[]> {
  return query<ArtistShow>(`
    SELECT id, artist_id, title, youtube_url, show_date::TEXT AS show_date, venue_name
    FROM artist_shows
    WHERE artist_id = $1
    ORDER BY show_date DESC NULLS LAST
  `, [artistId]);
}

export async function getArtistFeaturedLinks(artistId: string): Promise<ArtistLink[]> {
  return query<ArtistLink>(`
    SELECT id, artist_id, platform, url, label, display_order, is_active, is_featured,
           created_at::TEXT AS created_at, updated_at::TEXT AS updated_at
    FROM artist_links
    WHERE artist_id = $1 AND is_active = true AND is_featured = true
    ORDER BY display_order ASC
    LIMIT 3
  `, [artistId]);
}

export async function getAllArtistSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(`
    SELECT slug FROM artists WHERE is_active = true AND visible_on_website = true AND slug IS NOT NULL
  `);
  return rows.map(r => r.slug);
}
