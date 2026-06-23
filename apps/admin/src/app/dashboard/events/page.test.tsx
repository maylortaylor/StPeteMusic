import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EventsPage from './page';

function mockFetchSequence(handlers: Record<string, () => { ok: boolean; json: () => Promise<unknown> }>) {
  global.fetch = vi.fn((input: string | URL | Request) => {
    const url = String(input);
    for (const [pattern, handler] of Object.entries(handlers)) {
      if (url.includes(pattern)) return Promise.resolve(handler() as Response);
    }
    return Promise.resolve({ ok: true, json: async () => ({ events: [] }) } as Response);
  }) as typeof fetch;
}

describe('EventsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('imports an event directly when the API returns a full match', async () => {
    mockFetchSequence({
      '/api/events/import': () => ({
        ok: true,
        json: async () => ({ imported: true, name: 'Test Show', source: 'eventbrite' }),
      }),
      '/api/events?': () => ({ ok: true, json: async () => ({ events: [] }) }),
    });

    render(<EventsPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const urlInput = screen.getByPlaceholderText(/Paste an Eventbrite or Facebook event link/);
    fireEvent.change(urlInput, { target: { value: 'https://eventbrite.com/e/123' } });
    fireEvent.click(screen.getByText('Import →'));

    await waitFor(() => {
      expect(screen.getByText(/Added “Test Show”/)).toBeTruthy();
    });
  });

  it('shows the manual-entry form when the API can\'t auto-fetch the event', async () => {
    mockFetchSequence({
      '/api/events/import': () => ({
        ok: true,
        json: async () => ({ needsManualEntry: true, url: 'https://facebook.com/events/123', fbEventId: '123' }),
      }),
      '/api/events?': () => ({ ok: true, json: async () => ({ events: [] }) }),
    });

    render(<EventsPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const urlInput = screen.getByPlaceholderText(/Paste an Eventbrite or Facebook event link/);
    fireEvent.change(urlInput, { target: { value: 'https://facebook.com/events/123' } });
    fireEvent.click(screen.getByText('Import →'));

    const titleInput = await screen.findByPlaceholderText('Title *');
    expect(titleInput).toBeTruthy();
  });

  it('saves a manual entry and clears the form on success', async () => {
    mockFetchSequence({
      '/api/events/import': () => ({
        ok: true,
        json: async () => ({ needsManualEntry: true, url: 'https://facebook.com/events/123', fbEventId: '123' }),
      }),
      '/api/events?': () => ({ ok: true, json: async () => ({ events: [] }) }),
      '/api/events': () => ({ ok: true, json: async () => ({ id: 'new-id' }) }),
    });

    render(<EventsPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/Paste an Eventbrite or Facebook event link/), {
      target: { value: 'https://facebook.com/events/123' },
    });
    fireEvent.click(screen.getByText('Import →'));

    const titleInput = await screen.findByPlaceholderText('Title *');
    fireEvent.change(titleInput, { target: { value: 'Manual Show' } });
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-08-01' } });

    fireEvent.click(screen.getByText('Save Event'));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Title *')).toBeFalsy();
    });
  });
});
