import { google } from 'googleapis';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date | null;
  location: string | null;
  htmlLink: string;
};

export type MatchResult = {
  event: CalendarEvent | null;
  confidence: 'confirmed' | 'guessed' | 'none';
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

function calendar() {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing YouTube OAuth env vars — same credentials are used for Google Calendar access',
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth });
}

// ─── Event Fetching ───────────────────────────────────────────────────────────

/**
 * Fetch all events from a calendar within a date range.
 * Uses the Suite E calendar (GOOGLE_CALENDAR_ID env var).
 */
export async function fetchEventsInRange(
  startDate: Date,
  endDate: Date,
  calendarId?: string,
): Promise<CalendarEvent[]> {
  const id = calendarId ?? process.env.GOOGLE_CALENDAR_ID;
  if (!id) throw new Error('Missing GOOGLE_CALENDAR_ID env var');

  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const res = await calendar().events.list({
      calendarId: id,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      pageToken,
    });

    for (const item of res.data.items ?? []) {
      if (!item.id || !item.summary) continue;
      events.push({
        id: item.id,
        title: item.summary,
        description: item.description ?? '',
        startTime: new Date(item.start?.dateTime ?? item.start?.date ?? ''),
        endTime: item.end?.dateTime ? new Date(item.end.dateTime) : null,
        location: item.location ?? null,
        htmlLink: item.htmlLink ?? '',
      });
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return events;
}

// ─── Matching ─────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'at', 'in', 'on', 'for', 'with',
  'live', 'ft', 'feat', 'featuring', 'presents', 'music', 'show',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t)),
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) {
    if (b.has(word)) shared++;
  }
  return shared / Math.min(a.size, b.size);
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Match a video's publish date and title against a list of calendar events.
 *
 * Confidence rules:
 *   confirmed — date within 1 day AND overlap score ≥ 0.25
 *   guessed   — date within 3 days AND overlap score ≥ 0.15, OR date match within 1 day with no title overlap
 *   none      — no usable match found
 */
export function matchVideoToEvent(
  videoPublishedAt: Date,
  videoTitle: string,
  events: CalendarEvent[],
): MatchResult {
  if (events.length === 0) return { event: null, confidence: 'none' };

  const videoTokens = tokenize(videoTitle);

  let best: { event: CalendarEvent; score: number; days: number } | null = null;

  for (const event of events) {
    const days = daysBetween(videoPublishedAt, event.startTime);
    if (days > 7) continue; // not worth comparing

    const eventTokens = tokenize(`${event.title} ${event.description}`);
    const score = overlapScore(videoTokens, eventTokens);

    if (!best || score > best.score || (score === best.score && days < best.days)) {
      best = { event, score, days };
    }
  }

  if (!best) return { event: null, confidence: 'none' };

  if (best.days <= 1 && best.score >= 0.25) {
    return { event: best.event, confidence: 'confirmed' };
  }

  if ((best.days <= 3 && best.score >= 0.15) || (best.days <= 1)) {
    return { event: best.event, confidence: 'guessed' };
  }

  return { event: null, confidence: 'none' };
}
