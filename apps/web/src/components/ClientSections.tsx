'use client';

/**
 * Client-only dynamic imports for sections that use scroll hooks.
 * `ssr: false` is only valid inside a 'use client' component in the App Router.
 * page.tsx (Server Component) imports from here instead of calling dynamic() directly.
 */
import dynamic from 'next/dynamic';

export const PhotoStrip = dynamic(
  () => import('./PhotoStrip').then((m) => m.PhotoStrip),
  { ssr: false },
);

export const EventsTeaser = dynamic(
  () => import('./EventsTeaser').then((m) => m.EventsTeaser),
  { ssr: false },
);

export const VibesSection = dynamic(
  () => import('./VibesSection').then((m) => m.VibesSection),
  { ssr: false },
);
