import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EventbritePage from './page';

function mockFetchSequence(handlers: Record<string, () => { ok: boolean; json: () => Promise<unknown> }>) {
  global.fetch = vi.fn((input: string | URL | Request) => {
    const url = String(input);
    for (const [pattern, handler] of Object.entries(handlers)) {
      if (url.includes(pattern)) return Promise.resolve(handler() as Response);
    }
    return Promise.resolve({ ok: true, json: async () => ({ events: [] }) } as Response);
  }) as typeof fetch;
}

const fbInputPlaceholder = 'https://www.facebook.com/events/…';

describe('EventbritePage — Facebook import', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the manual-entry form when Facebook details can\'t be auto-fetched', async () => {
    mockFetchSequence({
      '/api/events/import': () => ({
        ok: true,
        json: async () => ({ needsManualEntry: true, url: 'https://facebook.com/events/123', fbEventId: '123' }),
      }),
      '/api/eventbrite/events': () => ({ ok: true, json: async () => ({ events: [], stats: {}, total: 0 }) }),
      '/api/events?show_on_tickets=true': () => ({ ok: true, json: async () => ({ events: [] }) }),
    });

    render(<EventbritePage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(fbInputPlaceholder), {
      target: { value: 'https://facebook.com/events/123' },
    });
    fireEvent.click(screen.getByText('Add →'));

    expect(await screen.findByPlaceholderText('Title *')).toBeTruthy();
  });

  it('saves a Facebook manual entry with show_on_tickets and clears the form', async () => {
    mockFetchSequence({
      '/api/events/import': () => ({
        ok: true,
        json: async () => ({ needsManualEntry: true, url: 'https://facebook.com/events/123', fbEventId: '123' }),
      }),
      '/api/eventbrite/events': () => ({ ok: true, json: async () => ({ events: [], stats: {}, total: 0 }) }),
      '/api/events?show_on_tickets=true': () => ({ ok: true, json: async () => ({ events: [] }) }),
      '/api/events': () => ({ ok: true, json: async () => ({ id: 'new-id' }) }),
    });

    render(<EventbritePage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(fbInputPlaceholder), {
      target: { value: 'https://facebook.com/events/123' },
    });
    fireEvent.click(screen.getByText('Add →'));

    const titleInput = await screen.findByPlaceholderText('Title *');
    fireEvent.change(titleInput, { target: { value: 'FB Show' } });
    const [startInput] = document.querySelectorAll('input[type="datetime-local"]');
    fireEvent.change(startInput, { target: { value: '2026-08-01T20:00' } });

    fireEvent.click(screen.getByText('Save Event'));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Title *')).toBeFalsy();
    });

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit][];
    const saveCall = calls.find((call) => call[0] === '/api/events');
    expect(saveCall).toBeDefined();
    const body = JSON.parse(saveCall![1].body as string);
    expect(body.show_on_tickets).toBe(true);
  });
});
