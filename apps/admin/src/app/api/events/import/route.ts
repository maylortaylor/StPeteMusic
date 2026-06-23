import { auth } from '@clerk/nextjs/server';
import { getDb, events, eventbrite_events, sql, eq } from '@stpetemusic/db';
import { fetchEventById, parseEventbriteEventId } from '@/lib/eventbrite-client';
import { fetchFacebookEventById, parseFacebookEventId, resolveFacebookEventUrl } from '@/lib/facebook-client';
import { revalidateWebApp } from '@/lib/revalidate';

type ImportBody = { url?: string; showOnTickets?: boolean };
type Db = ReturnType<typeof getDb>;
type EventValues = typeof events.$inferInsert;

function detectPlatform(url: string): 'eventbrite' | 'facebook' | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }
  if (hostname.includes('eventbrite')) return 'eventbrite';
  if (hostname.includes('facebook.com') || hostname.includes('fb.me')) return 'facebook';
  return null;
}

// Shared by both platforms: find an existing row tagged with this
// extra_data field and update it, or insert a new one.
async function upsertEventByExtraDataField(
  db: Db,
  field: string,
  value: string,
  values: EventValues,
): Promise<string> {
  const existing = await db
    .select({ id: events.id })
    .from(events)
    .where(sql`${events.extra_data}->>${field} = ${value}`)
    .limit(1);

  if (existing[0]) {
    await db.update(events).set(values).where(eq(events.id, existing[0].id));
    return existing[0].id;
  }

  const inserted = await db.insert(events).values(values).returning({ id: events.id });
  return inserted[0].id;
}

// An admin may have already linked this Eventbrite event to a calendar
// row from the /dashboard/eventbrite ticketing page — update that row
// instead of creating a duplicate.
async function saveEventbriteValues(db: Db, eventId: string, values: EventValues): Promise<string> {
  const linked = await db
    .select({ linked_event_id: eventbrite_events.linked_event_id })
    .from(eventbrite_events)
    .where(eq(eventbrite_events.eventbrite_id, eventId))
    .limit(1);
  const linkedEventId = linked[0]?.linked_event_id ?? null;

  if (linkedEventId) {
    await db.update(events).set(values).where(eq(events.id, linkedEventId));
    return linkedEventId;
  }
  return upsertEventByExtraDataField(db, 'eventbrite_id', eventId, values);
}

async function importEventbrite(db: Db, url: string, showOnTickets?: boolean): Promise<Response> {
  const eventId = parseEventbriteEventId(url);
  if (!eventId) {
    return Response.json({ error: 'Could not parse Eventbrite event ID from URL' }, { status: 400 });
  }

  let ebEvent;
  try {
    ebEvent = await fetchEventById(eventId);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch event from Eventbrite' },
      { status: 502 },
    );
  }

  if (!ebEvent.name || !ebEvent.startUtc) {
    return Response.json(
      { error: 'Eventbrite event is missing a name or start time' },
      { status: 502 },
    );
  }

  const location = [ebEvent.venueName, ebEvent.venueAddress].filter(Boolean).join(', ') || null;
  const values = {
    title: ebEvent.name,
    description: ebEvent.descriptionText,
    start_time: ebEvent.startUtc,
    end_time: ebEvent.endUtc,
    location,
    ticket_url: ebEvent.url,
    image_url: ebEvent.logoUrl,
    source: 'eventbrite',
    extra_data: { source: 'eventbrite', eventbrite_id: eventId, eventbrite_url: url },
    review_status: 'approved',
    is_active: true,
    // Only ever turns this ON here — "remove from /tickets" is a separate,
    // explicit admin action, not an accidental side effect of re-importing.
    ...(showOnTickets ? { show_on_tickets: true } : {}),
  };

  const savedId = await saveEventbriteValues(db, eventId, values);

  await revalidateWebApp(showOnTickets ? 'tickets' : undefined);
  return Response.json({ imported: true, id: savedId, name: ebEvent.name, source: 'eventbrite' });
}

async function importFacebook(db: Db, url: string, showOnTickets?: boolean): Promise<Response> {
  // facebook.com/share/... links have no event ID in the URL itself —
  // follow the redirect to the canonical /events/{id} URL before parsing,
  // and store that permanent URL instead of the share link (which can expire).
  let fbEventId = parseFacebookEventId(url);
  let canonicalUrl = url;
  if (!fbEventId) {
    canonicalUrl = await resolveFacebookEventUrl(url);
    fbEventId = parseFacebookEventId(canonicalUrl);
  }
  if (!fbEventId) {
    return Response.json({ error: 'Could not parse a Facebook event ID from URL' }, { status: 400 });
  }

  let fbEvent;
  try {
    fbEvent = await fetchFacebookEventById(fbEventId);
  } catch (err) {
    // Distinguish "not configured" from "Facebook denied/couldn't find it" —
    // the former is a server misconfiguration, not a normal manual-entry case.
    if (err instanceof Error && err.message.includes('FB_APP_ID')) {
      return Response.json(
        { error: 'Facebook import is not configured on this server (missing FB_APP_ID/FB_APP_SECRET).' },
        { status: 500 },
      );
    }
    console.error('Unexpected error fetching Facebook event:', err);
    fbEvent = null;
  }
  if (!fbEvent) {
    return Response.json({ needsManualEntry: true, url, fbEventId });
  }

  const values = {
    title: fbEvent.name,
    description: fbEvent.description,
    start_time: fbEvent.startTime,
    end_time: fbEvent.endTime,
    location: fbEvent.locationName,
    ticket_url: fbEvent.ticketUrl,
    image_url: fbEvent.imageUrl,
    source: 'facebook',
    extra_data: { source: 'facebook', fb_event_id: fbEventId, fb_event_url: canonicalUrl },
    review_status: 'approved',
    is_active: true,
    ...(showOnTickets ? { show_on_tickets: true } : {}),
  };

  const savedId = await upsertEventByExtraDataField(db, 'fb_event_id', fbEventId, values);

  await revalidateWebApp(showOnTickets ? 'tickets' : undefined);
  return Response.json({ imported: true, id: savedId, name: fbEvent.name, source: 'facebook' });
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const body = (await request.json().catch(() => ({}))) as ImportBody;
    const { url, showOnTickets } = body;
    if (!url) {
      return Response.json({ error: 'url is required' }, { status: 400 });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return Response.json(
        { error: 'Paste an Eventbrite or Facebook event link.' },
        { status: 400 },
      );
    }

    const db = getDb();
    return platform === 'eventbrite'
      ? await importEventbrite(db, url, showOnTickets)
      : await importFacebook(db, url, showOnTickets);
  } catch (err) {
    console.error('POST /api/events/import error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
