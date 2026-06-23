import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { parseFacebookEventId, fetchFacebookEventById, resolveFacebookEventUrl } from './facebook-client';

describe('parseFacebookEventId', () => {
  it('extracts the numeric ID from a standard event URL', () => {
    expect(parseFacebookEventId('https://www.facebook.com/events/1234567890/')).toBe(
      '1234567890',
    );
  });

  it('extracts the ID when followed by a slug', () => {
    expect(
      parseFacebookEventId('https://www.facebook.com/events/1234567890/some-event-name/'),
    ).toBe('1234567890');
  });

  it('extracts the ID when followed by query params', () => {
    expect(
      parseFacebookEventId('https://www.facebook.com/events/1234567890?acontext=foo'),
    ).toBe('1234567890');
  });

  it('handles the mobile subdomain', () => {
    expect(parseFacebookEventId('https://m.facebook.com/events/1234567890')).toBe('1234567890');
  });

  it('returns null for a non-Facebook URL', () => {
    expect(parseFacebookEventId('https://www.eventbrite.com/e/some-event-12345')).toBeNull();
  });

  it('returns null for a Facebook URL with no event ID', () => {
    expect(parseFacebookEventId('https://www.facebook.com/stpetemusic')).toBeNull();
  });

  it('returns null for an unparsable string', () => {
    expect(parseFacebookEventId('not a url')).toBeNull();
  });

  it('takes the last numeric segment for the two-ID event URL shape', () => {
    // Confirmed by following a real facebook.com/share/... redirect chain:
    // it lands on /events/{B}/ first, then Facebook rewrites it to
    // /events/{A}/{B}/ — so {B} (the last segment) is the real event ID.
    expect(
      parseFacebookEventId('https://www.facebook.com/events/901609049524753/901618279523830'),
    ).toBe('901618279523830');
  });
});

describe('resolveFacebookEventUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the final URL after following redirects', async () => {
    // Response.url isn't settable via the constructor, so mock a plain object
    // shaped like the bits of Response that resolveFacebookEventUrl reads.
    const mockResponse = { url: 'https://www.facebook.com/events/901609049524753/901618279523830/' };
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const resolved = await resolveFacebookEventUrl('https://www.facebook.com/share/1GqsuDNkYG/');
    expect(resolved).toBe('https://www.facebook.com/events/901609049524753/901618279523830/');
  });

  it('returns the original URL unchanged for a non-Facebook host', async () => {
    const url = 'https://www.eventbrite.com/e/some-event-12345';
    expect(await resolveFacebookEventUrl(url)).toBe(url);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns the original URL unchanged when the fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));
    const url = 'https://www.facebook.com/share/1GqsuDNkYG/';
    expect(await resolveFacebookEventUrl(url)).toBe(url);
  });
});

describe('fetchFacebookEventById', () => {
  beforeEach(() => {
    vi.stubEnv('FB_APP_ID', 'test-app-id');
    vi.stubEnv('FB_APP_SECRET', 'test-app-secret');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns a normalized event on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: 'Test Show',
          description: 'A great show',
          start_time: '2026-08-01T20:00:00-0400',
          end_time: '2026-08-01T23:00:00-0400',
          cover: { source: 'https://scontent.fbcdn.net/cover.jpg' },
          ticket_uri: 'https://tickets.example.com',
          place: { name: 'Some Venue' },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchFacebookEventById('1234567890');
    expect(result).toMatchObject({
      fbEventId: '1234567890',
      name: 'Test Show',
      description: 'A great show',
      imageUrl: 'https://scontent.fbcdn.net/cover.jpg',
      ticketUrl: 'https://tickets.example.com',
      locationName: 'Some Venue',
    });
    expect(result?.startTime).toBeInstanceOf(Date);
  });

  it('returns null when the Graph API responds with a permission error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: 'Permissions error', code: 200 } }),
        { status: 400 },
      ),
    );

    expect(await fetchFacebookEventById('1234567890')).toBeNull();
  });

  it('returns null when required fields are missing from the response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    expect(await fetchFacebookEventById('1234567890')).toBeNull();
  });

  it('throws when FB_APP_ID/FB_APP_SECRET are not configured', async () => {
    vi.unstubAllEnvs();
    await expect(fetchFacebookEventById('1234567890')).rejects.toThrow(
      'Missing env var: FB_APP_ID or FB_APP_SECRET',
    );
  });
});
