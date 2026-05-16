import { auth } from '@clerk/nextjs/server';
import { getDb, eventbrite_events, sql } from '@stpetemusic/db';
import { getOrgId, syncAllEvents } from '@/lib/eventbrite-client';

export const maxDuration = 60;

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    if (!process.env.EVENTBRITE_PRIVATE_TOKEN) {
      return Response.json({ error: 'EVENTBRITE_PRIVATE_TOKEN is not configured' }, { status: 500 });
    }

    const { id: orgId } = await getOrgId();
    const events = await syncAllEvents(orgId);

    const db = getDb();
    let added = 0;
    let updated = 0;
    const errors: { eventId: string; message: string }[] = [];

    for (const event of events) {
      try {
        // Build the upsert row — pull revenue fields from the extended sync result
        const extendedEvent = event as typeof event & {
          grossRevenueCents?: number;
          netRevenueCents?: number;
          feesCents?: number;
          reportCurrency?: string;
        };

        const row = {
          eventbrite_id: event.eventbriteId,
          name: event.name,
          description_text: event.descriptionText,
          description_html: event.descriptionHtml,
          url: event.url,
          status: event.status,
          currency: event.currency,
          start_utc: event.startUtc,
          start_local: event.startLocal,
          start_timezone: event.startTimezone,
          end_utc: event.endUtc,
          end_local: event.endLocal,
          end_timezone: event.endTimezone,
          logo_url: event.logoUrl,
          logo_id: event.logoId,
          category_id: event.categoryId,
          category_name: event.categoryName,
          subcategory_id: event.subcategoryId,
          subcategory_name: event.subcategoryName,
          format_id: event.formatId,
          format_name: event.formatName,
          is_free: event.isFree,
          online_event: event.onlineEvent,
          capacity: event.capacity,
          ticket_availability_status: event.ticketAvailabilityStatus,
          quantity_available: event.quantityAvailable,
          venue_id_eb: event.venueIdEb,
          venue_name: event.venueName,
          venue_address: event.venueAddress,
          venue_city: event.venueCity,
          venue_region: event.venueRegion,
          venue_country: event.venueCountry,
          venue_latitude: event.venueLatitude,
          venue_longitude: event.venueLongitude,
          organizer_id_eb: event.organizerIdEb,
          organizer_name: event.organizerName,
          org_id: event.orgId,
          ticket_classes: event.ticketClasses,
          quantity_sold: event.quantitySold,
          quantity_total: event.quantityTotal,
          gross_revenue_cents: extendedEvent.grossRevenueCents ?? null,
          net_revenue_cents: extendedEvent.netRevenueCents ?? null,
          fees_cents: extendedEvent.feesCents ?? null,
          report_currency: extendedEvent.reportCurrency ?? null,
          raw_data: event,
          synced_at: new Date(),
        };

        const existing = await db
          .select({ eventbrite_id: eventbrite_events.eventbrite_id })
          .from(eventbrite_events)
          .where(sql`${eventbrite_events.eventbrite_id} = ${event.eventbriteId}`)
          .limit(1);

        if (existing.length === 0) {
          await db.insert(eventbrite_events).values(row);
          added++;
        } else {
          // Never overwrite linked_event_id — it's admin-set
          await db
            .update(eventbrite_events)
            .set({ ...row, updated_at: new Date() })
            .where(sql`${eventbrite_events.eventbrite_id} = ${event.eventbriteId}`);
          updated++;
        }
      } catch (err) {
        errors.push({
          eventId: event.eventbriteId,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return Response.json({ synced: events.length, added, updated, errors });
  } catch (err) {
    console.error('POST /api/eventbrite/events/sync error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
