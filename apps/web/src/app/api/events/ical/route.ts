import { query } from '@/lib/db';
import { icalDate } from '@/lib/icalDate';

interface EventRow {
  id: string;
  google_event_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  ticket_url: string | null;
  venue: string | null;
}

function icalEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function icalFold(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;
  const chars = [...line];
  const chunks: string[] = [];
  let current = '';
  for (const ch of chars) {
    const next = current + ch;
    // Continuation lines start with \r\n<space> (3 bytes), count them in the limit.
    const prefix = chunks.length === 0 ? '' : '\r\n ';
    if (Buffer.byteLength(prefix + next, 'utf8') > 75) {
      chunks.push(current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks[0] + chunks.slice(1).map(c => '\r\n ' + c).join('');
}

function buildVEvent(event: EventRow): string {
  const uid = event.google_event_id
    ? `${event.google_event_id}@stpetemusic.live`
    : `${event.id}@stpetemusic.live`;

  const lines: string[] = [
    'BEGIN:VEVENT',
    icalFold(`UID:${uid}`),
    icalFold(`DTSTART:${icalDate(event.start_time)}`),
  ];

  if (event.end_time) {
    lines.push(icalFold(`DTEND:${icalDate(event.end_time)}`));
  }

  lines.push(icalFold(`SUMMARY:${icalEscape(event.title)}`));

  if (event.description) {
    lines.push(icalFold(`DESCRIPTION:${icalEscape(event.description)}`));
  }

  if (event.location) {
    lines.push(icalFold(`LOCATION:${icalEscape(event.location)}`));
  }

  const url = event.ticket_url ?? `https://www.stpetemusic.live/events`;
  lines.push(icalFold(`URL:${url}`));

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    let rows: EventRow[];

    if (eventId) {
      rows = await query<EventRow>(
        `SELECT id, google_event_id, title, description,
                start_time::TEXT AS start_time, end_time::TEXT AS end_time,
                location, ticket_url, venue
         FROM events
         WHERE id = $1 AND is_active = true
         LIMIT 1`,
        [eventId],
      );
    } else {
      rows = await query<EventRow>(
        `SELECT id, google_event_id, title, description,
                start_time::TEXT AS start_time, end_time::TEXT AS end_time,
                location, ticket_url, venue
         FROM events
         WHERE is_active = true
           AND start_time >= NOW()
           AND start_time <= NOW() + INTERVAL '90 days'
         ORDER BY start_time ASC
         LIMIT 300`,
      );
    }

    const vevents = rows.map(buildVEvent).join('\r\n');

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StPeteMusic//Live Music Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:St. Pete Music Events',
      'X-WR-TIMEZONE:America/New_York',
      'X-WR-CALDESC:Live music events in St. Petersburg, FL — stpetemusic.live',
      vevents,
      'END:VCALENDAR',
    ].join('\r\n');

    const filename = eventId ? 'event.ics' : 'stpetemusic-events.ics';

    return new Response(ical, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('iCal generation failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
