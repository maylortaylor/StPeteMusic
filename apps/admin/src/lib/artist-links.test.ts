import { describe, expect, it } from 'vitest';
import { buildEnrichmentStatus, canSetFeatured } from './artist-links';

describe('canSetFeatured', () => {
  it('returns true when there are no featured links', () => {
    expect(canSetFeatured([])).toBe(true);
  });

  it('returns true when fewer than 3 links are featured', () => {
    const links = [
      { is_featured: true },
      { is_featured: true },
      { is_featured: false },
    ];
    expect(canSetFeatured(links)).toBe(true);
  });

  it('returns false when exactly 3 links are already featured', () => {
    const links = [
      { is_featured: true },
      { is_featured: true },
      { is_featured: true },
    ];
    expect(canSetFeatured(links)).toBe(false);
  });

  it('returns false when more than 3 links are featured (defensive)', () => {
    const links = [
      { is_featured: true },
      { is_featured: true },
      { is_featured: true },
      { is_featured: true },
    ];
    expect(canSetFeatured(links)).toBe(false);
  });
});

describe('buildEnrichmentStatus', () => {
  it('returns enrichment_ready when no error', () => {
    expect(buildEnrichmentStatus(false)).toBe('enrichment_ready');
  });

  it('returns enrichment_failed when error', () => {
    expect(buildEnrichmentStatus(true)).toBe('enrichment_failed');
  });
});
