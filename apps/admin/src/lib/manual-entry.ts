import { easternToUtcIso } from './eastern-time';

export interface ManualEntryFormValues {
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  ticket_url: string;
}

export interface BuildManualEntryPayloadOptions {
  showOnTickets?: boolean;
}

// Shared by the eventbrite/page.tsx Facebook-manual-entry form and the
// events/page.tsx generic manual-entry form — both POST the same shape to
// /api/events, differing only in whether show_on_tickets is set.
export function buildManualEntryPayload(
  form: ManualEntryFormValues,
  sourceUrl: string,
  options: BuildManualEntryPayloadOptions = {},
) {
  return {
    title: form.title,
    start_time: easternToUtcIso(form.start_time),
    end_time: form.end_time ? easternToUtcIso(form.end_time) : undefined,
    location: form.location || undefined,
    image_url: form.image_url || undefined,
    ticket_url: form.ticket_url || undefined,
    source: 'facebook' as const,
    extra_data: { source: 'facebook', fb_event_url: sourceUrl },
    ...(options.showOnTickets ? { show_on_tickets: true } : {}),
  };
}
