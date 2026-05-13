import { unstable_cache } from 'next/cache';
import { query } from '@/lib/db';
import type { Event } from '@stpetemusic/types';

interface EventRow {
  id: string;
  google_event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  tag: string | null;
  ticket_url: string | null;
  venue: string | null;
  image_url: string | null;
  extra_data: string; // JSON string from DB
  performers: string; // JSON string from DB
}

interface MonthSpec {
  year: number;
  month: number; // 1-indexed
}

async function _getEventsForMonths(specs: MonthSpec[]): Promise<Event[]> {
  if (specs.length === 0) return [];

  // Build OR conditions — each spec contributes two params (year, month)
  const conditions = specs.map(
    (_, i) =>
      `(EXTRACT(YEAR FROM e.start_time) = $${i * 2 + 1} AND EXTRACT(MONTH FROM e.start_time) = $${i * 2 + 2})`,
  );
  const params: number[] = specs.flatMap(s => [s.year, s.month]);

  const rows = await query<EventRow>(`
    SELECT
      e.id,
      e.google_event_id,
      e.title,
      e.description,
      e.start_time::TEXT AS start_time,
      e.end_time::TEXT AS end_time,
      e.location,
      e.tag,
      e.ticket_url,
      e.venue,
      e.image_url,
      COALESCE(e.extra_data, '{}')::TEXT AS extra_data,
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'name', a.name,
            'slug', a.slug,
            'type', a.type,
            'instagram_handle', a.instagram_handle,
            'instagram_url', a.instagram_url,
            'genres', a.genres,
            'tags', a.tags,
            'extra_links', a.extra_links,
            'extra_data', a.extra_data,
            'is_active', a.is_active,
            'visible_on_website', a.visible_on_website
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
      )::TEXT AS performers
    FROM events e
    LEFT JOIN event_performers ep ON ep.event_id = e.id
    LEFT JOIN artists a ON a.id = ep.artist_id AND a.is_active = true
    WHERE e.is_active = true
      AND (${conditions.join(' OR ')})
    GROUP BY e.id
    ORDER BY e.start_time ASC
  `, params);

  return rows.map(row => ({
    ...row,
    extra_data: JSON.parse(row.extra_data),
    performers: JSON.parse(row.performers),
  }));
}

// Cache for 96 hours — matches n8n sync interval.
// Wrap so the cache key includes the actual month specs.
export function getEventsForMonths(specs: { year: number; month: number }[]) {
  const key = specs.map(s => `${s.year}-${s.month}`).join(',');
  return unstable_cache(_getEventsForMonths, [`events-for-months-${key}`], {
    revalidate: 345_600,
  })(specs);
}

// ─── Venue-specific upcoming events ──────────────────────────────────────────

async function _getEventsForVenue(venueSlug: string): Promise<Event[]> {
  const rows = await query<EventRow>(`
    SELECT
      e.id,
      e.google_event_id,
      e.title,
      e.description,
      e.start_time::TEXT AS start_time,
      e.end_time::TEXT AS end_time,
      e.location,
      e.tag,
      e.ticket_url,
      e.venue,
      e.image_url,
      COALESCE(e.extra_data, '{}')::TEXT AS extra_data,
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'name', a.name,
            'slug', a.slug,
            'type', a.type,
            'instagram_handle', a.instagram_handle,
            'instagram_url', a.instagram_url,
            'genres', a.genres,
            'tags', a.tags,
            'extra_links', a.extra_links,
            'extra_data', a.extra_data,
            'is_active', a.is_active,
            'visible_on_website', a.visible_on_website
          )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
      )::TEXT AS performers
    FROM events e
    LEFT JOIN event_performers ep ON ep.event_id = e.id
    LEFT JOIN artists a ON a.id = ep.artist_id AND a.is_active = true
    WHERE e.is_active = true
      AND e.venue = $1
      AND e.start_time >= NOW()
    GROUP BY e.id
    ORDER BY e.start_time ASC
    LIMIT 20
  `, [venueSlug]);

  return rows.map(row => ({
    ...row,
    extra_data: JSON.parse(row.extra_data),
    performers: JSON.parse(row.performers),
  }));
}

// Cache for 1 hour — venue upcoming events change more frequently than monthly views.
export function getEventsForVenue(venueSlug: string) {
  return unstable_cache(_getEventsForVenue, [`events-for-venue-${venueSlug}`], {
    revalidate: 3_600,
  })(venueSlug);
}
