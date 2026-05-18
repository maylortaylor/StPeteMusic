// ─── Types ────────────────────────────────────────────────────────────────────

export type EbTicketClass = {
  id: string;
  name: string;
  description: string | null;
  isFree: boolean;
  cost: { currency: string; value: number; display: string } | null;
  quantityTotal: number;
  quantitySold: number;
  quantityAvailable: number;
  minimumQuantity: number;
  maximumQuantity: number | null;
  salesChannels: string[];
  deliveryMethods: string[];
};

export type EbVenue = {
  id: string;
  name: string | null;
  address: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    localized_address_display: string | null;
  } | null;
  latitude: string | null;
  longitude: string | null;
};

export type EbEvent = {
  eventbriteId: string;
  name: string;
  descriptionText: string | null;
  descriptionHtml: string | null;
  url: string | null;
  status: string | null;
  currency: string | null;
  startUtc: Date | null;
  startLocal: string | null;
  startTimezone: string | null;
  endUtc: Date | null;
  endLocal: string | null;
  endTimezone: string | null;
  logoUrl: string | null;
  logoId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  formatId: string | null;
  formatName: string | null;
  isFree: boolean;
  onlineEvent: boolean;
  capacity: number | null;
  ticketAvailabilityStatus: string | null;
  quantityAvailable: number | null;
  venueIdEb: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  venueRegion: string | null;
  venueCountry: string | null;
  venueLatitude: string | null;
  venueLongitude: string | null;
  organizerIdEb: string | null;
  organizerName: string | null;
  orgId: string;
  ticketClasses: EbTicketClass[];
  quantitySold: number | null;
  quantityTotal: number | null;
};

export type EbSalesReport = {
  grossCents: number;
  netCents: number;
  feesCents: number;
  currency: string;
};

export type SyncResult = {
  synced: number;
  added: number;
  updated: number;
  errors: { eventId: string; message: string }[];
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

const EB_BASE = 'https://www.eventbriteapi.com/v3';

function getToken(): string {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN;
  if (!token) {
    throw new Error('Missing env var: EVENTBRITE_PRIVATE_TOKEN');
  }
  return token;
}

async function ebFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${EB_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Eventbrite API error ${res.status} for ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTicketClass(tc: any): EbTicketClass {
  return {
    id: tc.id,
    name: tc.name ?? '',
    description: tc.description ?? null,
    isFree: tc.free ?? false,
    cost: tc.cost
      ? { currency: tc.cost.currency, value: tc.cost.value, display: tc.cost.display }
      : null,
    quantityTotal: tc.quantity_total ?? 0,
    quantitySold: tc.quantity_sold ?? 0,
    quantityAvailable: tc.quantity_available ?? 0,
    minimumQuantity: tc.minimum_quantity ?? 1,
    maximumQuantity: tc.maximum_quantity ?? null,
    salesChannels: tc.sales_channels ?? [],
    deliveryMethods: tc.delivery_methods ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(raw: any, orgId: string, ticketClasses: EbTicketClass[]): EbEvent {
  const venue: EbVenue | null = raw.venue ?? null;
  const quantitySold = ticketClasses.reduce((sum, tc) => sum + tc.quantitySold, 0);
  const quantityTotal = ticketClasses.reduce((sum, tc) => sum + tc.quantityTotal, 0);

  return {
    eventbriteId: raw.id,
    name: raw.name?.text ?? raw.name ?? '',
    descriptionText: raw.description?.text ?? null,
    descriptionHtml: raw.description?.html ?? null,
    url: raw.url ?? null,
    status: raw.status ?? null,
    currency: raw.currency ?? null,
    startUtc: raw.start?.utc ? new Date(raw.start.utc) : null,
    startLocal: raw.start?.local ?? null,
    startTimezone: raw.start?.timezone ?? null,
    endUtc: raw.end?.utc ? new Date(raw.end.utc) : null,
    endLocal: raw.end?.local ?? null,
    endTimezone: raw.end?.timezone ?? null,
    logoUrl: raw.logo?.url ?? null,
    logoId: raw.logo?.id ?? null,
    categoryId: raw.category?.id ?? null,
    categoryName: raw.category?.name ?? null,
    subcategoryId: raw.subcategory?.id ?? null,
    subcategoryName: raw.subcategory?.name ?? null,
    formatId: raw.format?.id ?? null,
    formatName: raw.format?.name ?? null,
    isFree: raw.is_free ?? false,
    onlineEvent: raw.online_event ?? false,
    capacity: raw.capacity ?? null,
    ticketAvailabilityStatus: raw.ticket_availability?.status ?? null,
    quantityAvailable: raw.ticket_availability?.quantity_available ?? null,
    venueIdEb: venue?.id ?? null,
    venueName: venue?.name ?? null,
    venueAddress: venue?.address?.localized_address_display ?? null,
    venueCity: venue?.address?.city ?? null,
    venueRegion: venue?.address?.region ?? null,
    venueCountry: venue?.address?.country ?? null,
    venueLatitude: venue?.latitude ?? null,
    venueLongitude: venue?.longitude ?? null,
    organizerIdEb: raw.organizer?.id ?? null,
    organizerName: raw.organizer?.name ?? null,
    orgId,
    ticketClasses,
    quantitySold: quantityTotal > 0 ? quantitySold : null,
    quantityTotal: quantityTotal > 0 ? quantityTotal : null,
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getOrgId(): Promise<{ id: string; name: string }> {
  const data = await ebFetch<{ organizations: { id: string; name: string }[] }>(
    '/users/me/organizations/',
  );
  const pinned = process.env.EVENTBRITE_ORG_ID;
  if (pinned) {
    const match = data.organizations.find((o) => o.id === pinned);
    return { id: pinned, name: match?.name ?? pinned };
  }
  const org = data.organizations[0];
  if (!org) throw new Error('No Eventbrite organizations found for this account');
  return { id: org.id, name: org.name };
}

const EVENT_EXPAND =
  'venue,ticket_classes,ticket_availability,category,subcategory,format,organizer';

export async function listOrgEvents(orgId: string): Promise<EbEvent[]> {
  const allEvents: EbEvent[] = [];
  let continuation: string | undefined;

  do {
    const params = new URLSearchParams({
      status: 'all',
      expand: EVENT_EXPAND,
      page_size: '50',
    });
    if (continuation) params.set('continuation', continuation);

    const data = await ebFetch<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events: any[];
      pagination: { has_more_items: boolean; continuation?: string };
    }>(`/organizations/${orgId}/events/?${params}`);

    for (const raw of data.events) {
      const ticketClasses = (raw.ticket_classes ?? []).map(mapTicketClass);
      allEvents.push(mapEvent(raw, orgId, ticketClasses));
    }

    continuation = data.pagination.has_more_items ? data.pagination.continuation : undefined;
  } while (continuation);

  return allEvents;
}

export async function getSalesReport(
  orgId: string,
  eventId: string,
): Promise<EbSalesReport | null> {
  try {
    const data = await ebFetch<{
      data: { totals: { gross: number; net: number; fees: number; currency: string } }[];
    }>(`/organizations/${orgId}/reports/sales/?event_ids=${eventId}&group_by=event`);

    const totals = data.data?.[0]?.totals;
    if (!totals) return null;

    return {
      grossCents: Math.round((totals.gross ?? 0) * 100),
      netCents: Math.round((totals.net ?? 0) * 100),
      feesCents: Math.round((totals.fees ?? 0) * 100),
      currency: totals.currency ?? 'USD',
    };
  } catch {
    // Sales report may return 403 if token lacks financial scope — degrade gracefully
    return null;
  }
}

async function batchedSalesReports(
  orgId: string,
  events: EbEvent[],
  concurrency = 5,
): Promise<(EbSalesReport | null)[]> {
  const results: (EbSalesReport | null)[] = [];
  for (let i = 0; i < events.length; i += concurrency) {
    const batch = events.slice(i, i + concurrency);
    results.push(...(await Promise.all(batch.map((e) => getSalesReport(orgId, e.eventbriteId)))));
    if (i + concurrency < events.length) await new Promise((r) => setTimeout(r, 200));
  }
  return results;
}

export async function syncAllEvents(orgId: string): Promise<EbEvent[]> {
  const events = await listOrgEvents(orgId);

  // Only fetch sales reports for non-ended events to stay within API rate limits
  const activeStatuses = new Set(['live', 'started', 'draft']);
  const activeEvents = events.filter((e) => e.status && activeStatuses.has(e.status));
  const reports = await batchedSalesReports(orgId, activeEvents);

  return events.map((event) => {
    const activeIdx = activeEvents.findIndex((e) => e.eventbriteId === event.eventbriteId);
    const report = activeIdx >= 0 ? reports[activeIdx] : null;
    if (!report) return event;
    return {
      ...event,
      grossRevenueCents: report.grossCents,
      netRevenueCents: report.netCents,
      feesCents: report.feesCents,
      reportCurrency: report.currency,
    } as EbEvent & {
      grossRevenueCents: number;
      netRevenueCents: number;
      feesCents: number;
      reportCurrency: string;
    };
  });
}
