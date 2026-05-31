import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the route
vi.mock('@stpetemusic/db', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  })),
  artists: {},
  eq: vi.fn(),
}));

vi.mock('@/lib/artist-links', () => ({
  buildEnrichmentStatus: vi.fn((hasError: boolean) =>
    hasError ? 'enrichment_failed' : 'enrichment_ready',
  ),
}));

import { POST } from './route';

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/webhooks/artist-standalone-enrichment-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/webhooks/artist-standalone-enrichment-complete', () => {
  beforeEach(() => {
    vi.stubEnv('N8N_WEBHOOK_SECRET', 'test-secret');
  });

  it('returns 403 when x-webhook-secret header is missing', async () => {
    const response = await POST(makeRequest({ artistId: '123' }));
    expect(response.status).toBe(403);
  });

  it('returns 403 when x-webhook-secret is wrong', async () => {
    const response = await POST(
      makeRequest({ artistId: '123' }, { 'x-webhook-secret': 'wrong-secret' }),
    );
    expect(response.status).toBe(403);
  });

  it('returns 403 when N8N_WEBHOOK_SECRET env var is not set', async () => {
    vi.stubEnv('N8N_WEBHOOK_SECRET', '');
    const response = await POST(
      makeRequest({ artistId: '123' }, { 'x-webhook-secret': 'test-secret' }),
    );
    expect(response.status).toBe(403);
  });
});
