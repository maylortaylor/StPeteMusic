import type { ArtistLink } from '@stpetemusic/types';

export const KNOWN_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'bandcamp', label: 'Bandcamp' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'linktree', label: 'Linktree' },
  { value: 'website', label: 'Website' },
  { value: 'bandsintown', label: 'Bandsintown' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'threads', label: 'Threads' },
  { value: 'custom', label: 'Custom' },
];

/** Returns true if the artist can have another featured link (currently fewer than 3). */
export function canSetFeatured(links: Pick<ArtistLink, 'is_featured'>[]): boolean {
  return links.filter((l) => l.is_featured).length < 3;
}

/** Returns the status string for a completed standalone enrichment. */
export function buildEnrichmentStatus(hasError: boolean): 'enrichment_ready' | 'enrichment_failed' {
  return hasError ? 'enrichment_failed' : 'enrichment_ready';
}
