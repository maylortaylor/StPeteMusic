import { describe, expect, it, vi, beforeEach } from 'vitest';

const dbChain: Record<string, ReturnType<typeof vi.fn>> = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
};
for (const key of ['select', 'from', 'where', 'update', 'set', 'insert', 'values']) {
  dbChain[key].mockReturnValue(dbChain);
}

vi.mock('@stpetemusic/db', () => ({
  getDb: vi.fn(() => dbChain),
  events: { extra_data: 'extra_data', id: 'id' },
  eventbrite_events: { eventbrite_id: 'eventbrite_id', linked_event_id: 'linked_event_id' },
  sql: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((a: unknown, b: unknown) => ({ a, b })),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/eventbrite-client', () => ({
  parseEventbriteEventId: vi.fn(),
  fetchEventById: vi.fn(),
}));

vi.mock('@/lib/facebook-client', () => ({
  parseFacebookEventId: vi.fn(),
  fetchFacebookEventById: vi.fn(),
  resolveFacebookEventUrl: vi.fn((url: string) => Promise.resolve(url)),
}));

vi.mock('@/lib/revalidate', () => ({
  revalidateWebApp: vi.fn(),
}));

import { POST } from './route';
import { auth } from '@clerk/nextjs/server';
import { parseEventbriteEventId, fetchEventById } from '@/lib/eventbrite-client';
import { parseFacebookEventId, fetchFacebookEventById, resolveFacebookEventUrl } from '@/lib/facebook-client';
import { revalidateWebApp } from '@/lib/revalidate';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/events/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ userId: 'admin-user' } as never);
  dbChain.limit.mockResolvedValue([]);
  dbChain.returning.mockResolvedValue([{ id: 'new-id' }]);
});

describe('POST /api/events/import', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await POST(makeRequest({ url: 'https://www.facebook.com/events/1/' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when url is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an unsupported platform', async () => {
    const res = await POST(makeRequest({ url: 'https://example.com/some-page' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Eventbrite or Facebook/);
  });

  describe('Eventbrite branch', () => {
    it('returns 400 when the event ID cannot be parsed', async () => {
      vi.mocked(parseEventbriteEventId).mockReturnValue(null);
      const res = await POST(makeRequest({ url: 'https://www.eventbrite.com/e/bad-url' }));
      expect(res.status).toBe(400);
    });

    it('updates the linked events row instead of inserting a duplicate', async () => {
      vi.mocked(parseEventbriteEventId).mockReturnValue('123');
      vi.mocked(fetchEventById).mockResolvedValue({
        eventbriteId: '123',
        name: 'Linked Show',
        startUtc: new Date('2026-08-01T00:00:00Z'),
      } as never);
      dbChain.limit.mockResolvedValueOnce([{ linked_event_id: 'linked-event-id' }]);

      const res = await POST(makeRequest({ url: 'https://www.eventbrite.com/e/linked-show-123' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toMatchObject({ imported: true, id: 'linked-event-id', source: 'eventbrite' });
      expect(dbChain.update).toHaveBeenCalled();
      expect(dbChain.insert).not.toHaveBeenCalled();
    });

    it('inserts a new row when no linked or matching event exists', async () => {
      vi.mocked(parseEventbriteEventId).mockReturnValue('456');
      vi.mocked(fetchEventById).mockResolvedValue({
        eventbriteId: '456',
        name: 'New Show',
        startUtc: new Date('2026-08-01T00:00:00Z'),
      } as never);
      dbChain.limit.mockResolvedValueOnce([]); // no linked eventbrite_events row
      dbChain.limit.mockResolvedValueOnce([]); // no existing events row by extra_data

      const res = await POST(makeRequest({ url: 'https://www.eventbrite.com/e/new-show-456' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toMatchObject({ imported: true, id: 'new-id', source: 'eventbrite' });
      expect(dbChain.insert).toHaveBeenCalled();
      expect(dbChain.update).not.toHaveBeenCalled();
    });

    it('sets show_on_tickets and revalidates the tickets scope when showOnTickets is true', async () => {
      vi.mocked(parseEventbriteEventId).mockReturnValue('789');
      vi.mocked(fetchEventById).mockResolvedValue({
        eventbriteId: '789',
        name: 'Ticketed Show',
        startUtc: new Date('2026-08-01T00:00:00Z'),
      } as never);
      dbChain.limit.mockResolvedValueOnce([]);
      dbChain.limit.mockResolvedValueOnce([]);

      await POST(makeRequest({ url: 'https://www.eventbrite.com/e/ticketed-show-789', showOnTickets: true }));

      expect(dbChain.values).toHaveBeenCalledWith(expect.objectContaining({ show_on_tickets: true }));
      expect(revalidateWebApp).toHaveBeenCalledWith('tickets');
    });
  });

  describe('Facebook branch', () => {
    it('returns needsManualEntry when the Graph API fetch fails', async () => {
      vi.mocked(parseFacebookEventId).mockReturnValue('789');
      vi.mocked(fetchFacebookEventById).mockResolvedValue(null);

      const res = await POST(makeRequest({ url: 'https://www.facebook.com/events/789/' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toMatchObject({ needsManualEntry: true, fbEventId: '789' });
      expect(dbChain.insert).not.toHaveBeenCalled();
    });

    it('returns a distinct 500 error when FB_APP_ID/FB_APP_SECRET are not configured', async () => {
      vi.mocked(parseFacebookEventId).mockReturnValue('789');
      vi.mocked(fetchFacebookEventById).mockRejectedValue(
        new Error('Missing env var: FB_APP_ID or FB_APP_SECRET'),
      );

      const res = await POST(makeRequest({ url: 'https://www.facebook.com/events/789/' }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toMatch(/not configured/);
      expect(dbChain.insert).not.toHaveBeenCalled();
    });

    it('falls back to resolving a share link and stores the resolved URL', async () => {
      vi.mocked(parseFacebookEventId).mockReturnValueOnce(null); // share link doesn't parse directly
      vi.mocked(resolveFacebookEventUrl).mockResolvedValueOnce(
        'https://www.facebook.com/events/901609049524753/901618279523830/',
      );
      vi.mocked(parseFacebookEventId).mockReturnValueOnce('901618279523830'); // parses on retry
      vi.mocked(fetchFacebookEventById).mockResolvedValue({
        fbEventId: '901618279523830',
        name: 'Resolved Show',
        description: null,
        startTime: new Date('2026-08-01T00:00:00Z'),
        endTime: null,
        imageUrl: null,
        ticketUrl: null,
        locationName: null,
      });
      dbChain.limit.mockResolvedValueOnce([]);

      const res = await POST(makeRequest({ url: 'https://www.facebook.com/share/1GqsuDNkYG/' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toMatchObject({ imported: true, source: 'facebook' });
      expect(dbChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          extra_data: expect.objectContaining({
            fb_event_url: 'https://www.facebook.com/events/901609049524753/901618279523830/',
          }),
        }),
      );
    });

    it('updates an existing row instead of duplicating on re-import', async () => {
      vi.mocked(parseFacebookEventId).mockReturnValue('789');
      vi.mocked(fetchFacebookEventById).mockResolvedValue({
        fbEventId: '789',
        name: 'Repeat Show',
        description: null,
        startTime: new Date('2026-08-01T00:00:00Z'),
        endTime: null,
        imageUrl: null,
        ticketUrl: null,
        locationName: null,
      });
      dbChain.limit.mockResolvedValueOnce([{ id: 'existing-id' }]);

      const res = await POST(makeRequest({ url: 'https://www.facebook.com/events/789/' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toMatchObject({ imported: true, id: 'existing-id', source: 'facebook' });
      expect(dbChain.update).toHaveBeenCalled();
      expect(dbChain.insert).not.toHaveBeenCalled();
    });

    it('inserts a new row on first import', async () => {
      vi.mocked(parseFacebookEventId).mockReturnValue('999');
      vi.mocked(fetchFacebookEventById).mockResolvedValue({
        fbEventId: '999',
        name: 'Fresh Show',
        description: null,
        startTime: new Date('2026-08-01T00:00:00Z'),
        endTime: null,
        imageUrl: null,
        ticketUrl: null,
        locationName: null,
      });
      dbChain.limit.mockResolvedValueOnce([]);

      const res = await POST(makeRequest({ url: 'https://www.facebook.com/events/999/' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toMatchObject({ imported: true, id: 'new-id', source: 'facebook' });
      expect(dbChain.insert).toHaveBeenCalled();
    });

    it('sets show_on_tickets and revalidates the tickets scope when showOnTickets is true', async () => {
      vi.mocked(parseFacebookEventId).mockReturnValue('111');
      vi.mocked(fetchFacebookEventById).mockResolvedValue({
        fbEventId: '111',
        name: 'Ticketed FB Show',
        description: null,
        startTime: new Date('2026-08-01T00:00:00Z'),
        endTime: null,
        imageUrl: null,
        ticketUrl: null,
        locationName: null,
      });
      dbChain.limit.mockResolvedValueOnce([]);

      await POST(makeRequest({ url: 'https://www.facebook.com/events/111/', showOnTickets: true }));

      expect(dbChain.values).toHaveBeenCalledWith(expect.objectContaining({ show_on_tickets: true }));
      expect(revalidateWebApp).toHaveBeenCalledWith('tickets');
    });

    it('does not set show_on_tickets when showOnTickets is omitted', async () => {
      vi.mocked(parseFacebookEventId).mockReturnValue('222');
      vi.mocked(fetchFacebookEventById).mockResolvedValue({
        fbEventId: '222',
        name: 'Calendar-only Show',
        description: null,
        startTime: new Date('2026-08-01T00:00:00Z'),
        endTime: null,
        imageUrl: null,
        ticketUrl: null,
        locationName: null,
      });
      dbChain.limit.mockResolvedValueOnce([]);

      await POST(makeRequest({ url: 'https://www.facebook.com/events/222/' }));

      const insertedValues = dbChain.values.mock.calls[0][0];
      expect(insertedValues).not.toHaveProperty('show_on_tickets');
      expect(revalidateWebApp).toHaveBeenCalledWith(undefined);
    });
  });
});
