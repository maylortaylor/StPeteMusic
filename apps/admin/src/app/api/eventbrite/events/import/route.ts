import { auth } from '@clerk/nextjs/server';
import { getDb, eventbrite_events, sql } from '@stpetemusic/db';
import { fetchEventById, parseEventbriteEventId } from '@/lib/eventbrite-client';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    if (!process.env.EVENTBRITE_PRIVATE_TOKEN) {
      return Response.json({ error: 'EVENTBRITE_PRIVATE_TOKEN is not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({})) as { url?: string };
    const { url } = body;
    if (!url) {
      return Response.json({ error: 'url is required' }, { status: 400 });
    }

    const eventId = parseEventbriteEventId(url);
    if (!eventId) {
      return Response.json(
        { error: 'Could not parse Eventbrite event ID from URL' },
        { status: 400 },
      );
    }

    let event;
    try {
      event = await fetchEventById(eventId);
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : 'Failed to fetch event from Eventbrite' },
        { status: 502 },
      );
    }

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
      gross_revenue_cents: null,
      net_revenue_cents: null,
      fees_cents: null,
      report_currency: null,
      raw_data: event,
      synced_at: new Date(),
    };

    const db = getDb();
    const existing = await db
      .select({ eventbrite_id: eventbrite_events.eventbrite_id })
      .from(eventbrite_events)
      .where(sql`${eventbrite_events.eventbrite_id} = ${event.eventbriteId}`)
      .limit(1);

    if (existing.length === 0) {
      await db.insert(eventbrite_events).values(row);
    } else {
      // Never overwrite linked_event_id — it's admin-set
      await db
        .update(eventbrite_events)
        .set({ ...row, updated_at: new Date() })
        .where(sql`${eventbrite_events.eventbrite_id} = ${event.eventbriteId}`);
    }

    // Bust the web app's /tickets cache
    const webAppUrl = process.env.WEB_APP_URL;
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    if (webAppUrl && revalidationSecret) {
      await fetch(`${webAppUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${revalidationSecret}`,
        },
        body: JSON.stringify({ scope: 'eventbrite' }),
      })
        .then((r) => { if (!r.ok) r.text().then((b) => console.warn('Revalidation non-ok:', r.status, b)); })
        .catch((err) => console.warn('Revalidation call failed (non-fatal):', err));
    } else {
      console.warn('Revalidation skipped: WEB_APP_URL or REVALIDATION_SECRET not set');
    }

    return Response.json({
      imported: true,
      eventbriteId: event.eventbriteId,
      name: event.name,
      status: event.status,
      startUtc: event.startUtc,
    });
  } catch (err) {
    console.error('POST /api/eventbrite/events/import error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
