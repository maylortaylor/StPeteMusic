// ─── Types ────────────────────────────────────────────────────────────────────

export type FbEvent = {
  fbEventId: string;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  locationName: string | null;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

function getAppToken(): string {
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('Missing env var: FB_APP_ID or FB_APP_SECRET');
  }
  return `${appId}|${appSecret}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Extracts the numeric event ID from a Facebook event URL.
// Handles: facebook.com/events/12345/, m.facebook.com/events/12345/some-slug.
// Some event URLs have two numeric segments — facebook.com/events/{A}/{B}/ —
// where {A} is a share/context ID and {B} is the actual stable event object
// ID (confirmed by following a facebook.com/share/... redirect chain, which
// lands on /events/{B}/ first before Facebook rewrites it to /events/{A}/{B}/).
// The LAST numeric segment is always the real event ID; the first is not
// reliably fetchable via the Graph API.
export function parseFacebookEventId(url: string): string | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!hostname.includes('facebook.com') && !hostname.includes('fb.me')) {
    return null;
  }
  const match = url.match(/events\/([\d/]+)/);
  if (!match) return null;
  const segments = match[1].split('/').filter(Boolean);
  return segments[segments.length - 1] ?? null;
}

// facebook.com/share/... links (and similar short links) don't contain an
// event ID at all — they're redirects. Follows them and returns the final
// resolved URL so parseFacebookEventId can be retried against it. Returns
// the original URL unchanged on any failure (non-facebook host, network
// error, no redirect) — never throws.
export async function resolveFacebookEventUrl(url: string): Promise<string> {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return url;
  }
  if (!hostname.includes('facebook.com') && !hostname.includes('fb.me')) {
    return url;
  }
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return res.url || url;
  } catch {
    return url;
  }
}

const EVENT_FIELDS = 'name,description,start_time,end_time,cover,ticket_uri,place';

// Returns null (rather than throwing) when the Graph API denies access or the
// event can't be found — this is the expected common case for arbitrary
// third-party event URLs, since looking up any public event by ID requires
// the "Page Public Content Access" feature, not just basic Page management.
// Callers should treat null as "needs manual entry," not a hard failure.
export async function fetchFacebookEventById(eventId: string): Promise<FbEvent | null> {
  const params = new URLSearchParams({
    fields: EVENT_FIELDS,
    access_token: getAppToken(),
  });

  const res = await fetch(`${GRAPH_BASE}/${eventId}?${params}`, { cache: 'no-store' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await res.json().catch(() => null);

  if (!raw || raw.error || !res.ok) {
    console.warn(
      `[facebook-client] Graph API lookup failed for event ${eventId}:`,
      raw?.error ?? `HTTP ${res.status}`,
    );
    return null;
  }
  if (!raw.name || !raw.start_time) {
    console.warn(`[facebook-client] Graph API response for event ${eventId} is missing name/start_time:`, raw);
    return null;
  }

  return {
    fbEventId: eventId,
    name: raw.name,
    description: raw.description ?? null,
    startTime: new Date(raw.start_time),
    endTime: raw.end_time ? new Date(raw.end_time) : null,
    imageUrl: raw.cover?.source ?? null,
    ticketUrl: raw.ticket_uri ?? null,
    locationName: raw.place?.name ?? null,
  };
}
