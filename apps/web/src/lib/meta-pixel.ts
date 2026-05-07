declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1];
}

export function trackMetaEvent(event: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const eventId = `${event}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  if (typeof window.fbq === 'function') {
    if (data) {
      window.fbq('track', event, data, { eventID: eventId });
    } else {
      window.fbq('track', event, {}, { eventID: eventId });
    }
  }

  fetch('/api/meta-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: event,
      event_id: eventId,
      event_source_url: window.location.href,
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),
      custom_data: data,
    }),
  }).catch(() => {});
}
