import { pushEvent } from './analytics';
import { trackMetaEvent } from './meta-pixel';

interface MetaEvent {
  event: string;
  data?: Record<string, unknown>;
}

// Single entry point for call sites that need to fire both a GTM event and a
// Meta Pixel event for the same interaction, so changing either tracking API
// only requires updating this file instead of every call site.
export function trackEvent(event: string, params?: Record<string, unknown>, meta?: MetaEvent): void {
  pushEvent(event, params);
  if (meta) {
    trackMetaEvent(meta.event, meta.data);
  }
}
