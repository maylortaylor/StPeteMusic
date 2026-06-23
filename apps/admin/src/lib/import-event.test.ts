import { describe, expect, it, vi, afterEach } from 'vitest';
import { importEventViaApi } from './import-event';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('importEventViaApi', () => {
  it('posts the url and returns the parsed result on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Test Show', source: 'facebook' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await importEventViaApi('https://facebook.com/events/123');

    expect(fetchMock).toHaveBeenCalledWith('/api/events/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://facebook.com/events/123' }),
    });
    expect(result).toEqual({ name: 'Test Show', source: 'facebook' });
  });

  it('includes showOnTickets in the body when requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    await importEventViaApi('https://facebook.com/events/123', { showOnTickets: true });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/import',
      expect.objectContaining({
        body: JSON.stringify({ url: 'https://facebook.com/events/123', showOnTickets: true }),
      }),
    );
  });

  it('throws the server error message on a non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Could not parse event ID' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(importEventViaApi('bad-url')).rejects.toThrow('Could not parse event ID');
  });
});
