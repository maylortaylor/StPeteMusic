import { unstable_cache } from 'next/cache';
import { query } from '@/lib/db';

export type FeaturedTicketEvent = {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  image_url: string | null;
  ticket_url: string | null;
  source: string | null;
  extra_data: string; // JSON string
};

async function _getFeaturedTicketEvents(): Promise<FeaturedTicketEvent[]> {
  const rows = await query<FeaturedTicketEvent>(`
    SELECT
      id,
      title,
      start_time::text,
      end_time::text,
      location,
      image_url,
      ticket_url,
      source,
      COALESCE(extra_data, '{}')::text AS extra_data
    FROM events
    WHERE show_on_tickets = true
      AND is_active = true
      AND COALESCE(end_time, start_time + INTERVAL '6 hours') >= NOW() - INTERVAL '2 hours'
    ORDER BY start_time ASC
  `);
  return rows;
}

export const getFeaturedTicketEvents = unstable_cache(
  _getFeaturedTicketEvents,
  ['featured-ticket-events-v1'],
  { revalidate: 300, tags: ['featured-tickets'] },
);
