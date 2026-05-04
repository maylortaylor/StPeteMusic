// Thin wrapper around GTM dataLayer so all event pushes go through one place.
// Only call from 'use client' components — window is not available server-side.
export function pushEvent(event: string, params?: Record<string, unknown>): void {
  window.dataLayer?.push({ event, ...params });
}
