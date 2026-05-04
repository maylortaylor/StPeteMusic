// Thin wrapper around GTM dataLayer so all event pushes go through one place.
// Only call from 'use client' components — window is not available server-side.
export function pushEvent(event: string, params?: Record<string, unknown>): void {
  window.dataLayer?.push({ event, ...params });
}

export function pushPageView(path: string, title?: string): void {
  window.dataLayer?.push({
    event: 'page_view',
    page_location: `${window.location.origin}${path}`,
    page_title: title ? `${title} | St. Pete Music` : document.title,
    page_path: path,
  });
}
