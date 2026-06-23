import { describe, expect, it } from 'vitest';
import { buildManualEntryPayload, type ManualEntryFormValues } from './manual-entry';

const baseForm: ManualEntryFormValues = {
  title: 'Test Show',
  start_time: '2026-08-01T20:00',
  end_time: '',
  location: '',
  image_url: '',
  ticket_url: '',
};

describe('buildManualEntryPayload', () => {
  it('omits optional fields when blank', () => {
    const payload = buildManualEntryPayload(baseForm, 'https://facebook.com/events/123');
    expect(payload.title).toBe('Test Show');
    expect(payload.end_time).toBeUndefined();
    expect(payload.location).toBeUndefined();
    expect(payload.image_url).toBeUndefined();
    expect(payload.ticket_url).toBeUndefined();
    expect(payload.source).toBe('facebook');
    expect(payload.extra_data).toEqual({ source: 'facebook', fb_event_url: 'https://facebook.com/events/123' });
    expect(payload).not.toHaveProperty('show_on_tickets');
  });

  it('includes optional fields when present', () => {
    const form: ManualEntryFormValues = {
      ...baseForm,
      end_time: '2026-08-01T22:00',
      location: 'Suite E Studios',
      image_url: 'https://example.com/img.jpg',
      ticket_url: 'https://example.com/tickets',
    };
    const payload = buildManualEntryPayload(form, 'https://facebook.com/events/123');
    expect(payload.end_time).toBeDefined();
    expect(payload.location).toBe('Suite E Studios');
    expect(payload.image_url).toBe('https://example.com/img.jpg');
    expect(payload.ticket_url).toBe('https://example.com/tickets');
  });

  it('sets show_on_tickets only when requested', () => {
    const withFlag = buildManualEntryPayload(baseForm, 'https://facebook.com/events/123', { showOnTickets: true });
    expect(withFlag.show_on_tickets).toBe(true);

    const withoutFlag = buildManualEntryPayload(baseForm, 'https://facebook.com/events/123');
    expect(withoutFlag).not.toHaveProperty('show_on_tickets');
  });
});
