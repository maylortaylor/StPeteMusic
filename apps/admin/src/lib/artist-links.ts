import type { ArtistLink } from '@stpetemusic/types';

/** Returns true if the artist can have another featured link (currently fewer than 3). */
export function canSetFeatured(links: Pick<ArtistLink, 'is_featured'>[]): boolean {
  return links.filter((l) => l.is_featured).length < 3;
}

/** Returns the status string for a completed standalone enrichment. */
export function buildEnrichmentStatus(hasError: boolean): 'enrichment_ready' | 'enrichment_failed' {
  return hasError ? 'enrichment_failed' : 'enrichment_ready';
}
