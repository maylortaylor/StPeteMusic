import { unstable_cache } from 'next/cache';
import { query } from '@/lib/db';

export type EventbriteEventCard = {
  eventbrite_id: string;
  name: string;
  description_text: string | null;
  url: string | null;
  logo_url: string | null;
  status: string | null;
  start_utc: string;
  end_utc: string | null;
  start_timezone: string | null;
  is_free: boolean;
  ticket_availability_status: string | null;
  quantity_sold: number | null;
  quantity_total: number | null;
  quantity_available: number | null;
  venue_name: string | null;
  ticket_classes: string; // JSON string
};

async function _getActiveEventbriteEvents(): Promise<EventbriteEventCard[]> {
  const rows = await query<EventbriteEventCard>(`
    SELECT
      eventbrite_id,
      name,
      description_text,
      url,
      logo_url,
      status,
      start_utc::text,
      end_utc::text,
      start_timezone,
      is_free,
      ticket_availability_status,
      quantity_sold,
      quantity_total,
      quantity_available,
      venue_name,
      ticket_classes::text
    FROM eventbrite_events
    WHERE status IN ('live', 'started')
      AND (end_utc IS NULL OR end_utc >= NOW() - INTERVAL '2 hours')
    ORDER BY start_utc ASC
  `);
  return rows;
}

export const getActiveEventbriteEvents = unstable_cache(
  _getActiveEventbriteEvents,
  ['active-eventbrite-events'],
  { revalidate: 1800 }, // 30 minutes
);
