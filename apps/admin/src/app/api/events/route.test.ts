import { describe, expect, it, vi, beforeEach } from 'vitest';

const dbChain: Record<string, ReturnType<typeof vi.fn>> = {
  select: vi.fn(),
  from: vi.fn(),
  leftJoin: vi.fn(),
  where: vi.fn(),
  groupBy: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
};
for (const key of ['select', 'from', 'leftJoin', 'where', 'groupBy', 'orderBy', 'insert', 'values']) {
  dbChain[key].mockReturnValue(dbChain);
}

vi.mock('@stpetemusic/db', () => ({
  getDb: vi.fn(() => dbChain),
  events: {
    id: 'id', title: 'title', source: 'source', show_on_tickets: 'show_on_tickets',
    is_active: 'is_active', venue: 'venue', tag: 'tag', review_status: 'review_status',
    start_time: 'start_time',
  },
  event_performers: { artist_id: 'artist_id', event_id: 'event_id' },
  sql: vi.fn((...args: unknown[]) => args),
  asc: vi.fn((a: unknown) => ({ asc: a })),
  eq: vi.fn((a: unknown, b: unknown) => ({ eq: [a, b] })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  ilike: vi.fn((a: unknown, b: unknown) => ({ ilike: [a, b] })),
  logError: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/revalidate', () => ({
  revalidateWebApp: vi.fn(),
}));

import { GET, POST } from './route';
import { auth } from '@clerk/nextjs/server';
import { eq, ilike } from '@stpetemusic/db';
import { revalidateWebApp } from '@/lib/revalidate';

function makeGetRequest(query: string) {
  return new Request(`http://localhost/api/events${query}`);
}

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ userId: 'admin-user' } as never);
  dbChain.limit.mockResolvedValue([]);
  dbChain.returning.mockResolvedValue([{ id: 'new-id', show_on_tickets: false }]);
});

describe('GET /api/events', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await GET(makeGetRequest(''));
    expect(res.status).toBe(401);
  });

  it('filters by source', async () => {
    await GET(makeGetRequest('?source=google'));
    expect(eq).toHaveBeenCalledWith('source', 'google');
  });

  it('filters by title search via ilike', async () => {
    await GET(makeGetRequest('?q=jazz'));
    expect(ilike).toHaveBeenCalledWith('title', '%jazz%');
  });

  it('filters by show_on_tickets=true', async () => {
    await GET(makeGetRequest('?show_on_tickets=true'));
    expect(eq).toHaveBeenCalledWith('show_on_tickets', true);
  });

  it('filters by show_on_tickets=false', async () => {
    await GET(makeGetRequest('?show_on_tickets=false'));
    expect(eq).toHaveBeenCalledWith('show_on_tickets', false);
  });
});

describe('POST /api/events', () => {
  it('returns 400 when title or start_time is missing', async () => {
    const res = await POST(makePostRequest({ title: 'No start time' }));
    expect(res.status).toBe(400);
  });

  it('defaults show_on_tickets to false and does not revalidate the tickets scope', async () => {
    await POST(makePostRequest({ title: 'Calendar Event', start_time: '2026-08-01T00:00:00Z' }));
    expect(dbChain.values).toHaveBeenCalledWith(expect.objectContaining({ show_on_tickets: false }));
    expect(revalidateWebApp).toHaveBeenCalledWith(undefined);
  });

  it('sets show_on_tickets and revalidates the tickets scope when requested', async () => {
    dbChain.returning.mockResolvedValueOnce([{ id: 'new-id', show_on_tickets: true }]);
    await POST(makePostRequest({
      title: 'Ticketed Event',
      start_time: '2026-08-01T00:00:00Z',
      show_on_tickets: true,
    }));
    expect(dbChain.values).toHaveBeenCalledWith(expect.objectContaining({ show_on_tickets: true }));
    expect(revalidateWebApp).toHaveBeenCalledWith('tickets');
  });
});
