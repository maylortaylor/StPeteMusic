import type { MetadataRoute } from 'next';
import { getAllArtists } from '@/lib/queries/artists';
import { getAllVenues } from '@/lib/queries/venues';

const BASE_URL = 'https://www.stpetemusic.live';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artists, venues] = await Promise.all([
    getAllArtists().catch(() => []),
    getAllVenues().catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/venues`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  const artistRoutes: MetadataRoute.Sitemap = artists
    .filter(a => a.slug)
    .map(a => ({
      url: `${BASE_URL}/discover/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  const venueRoutes: MetadataRoute.Sitemap = venues
    .filter(v => v.slug)
    .map(v => ({
      url: `${BASE_URL}/venues/${v.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...artistRoutes, ...venueRoutes];
}
