import { ImageResponse } from 'next/og';
import { ogImageTemplate } from '@/lib/og/image-template';
import { readPublicImage } from '@/lib/og/read-public-image';
import { getVenueBySlug } from '@/lib/queries/venues';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug).catch(() => null);

  const backgroundSrc = venue?.hero_photo_url
    ? venue.hero_photo_url
    : readPublicImage('/images/og/venues-bg2.png');
  const logoSrc = readPublicImage('/images/brand/spm-logo-cable-white.png');

  const title = venue?.name ?? 'Live Music Venue';
  const subtitle = venue?.address
    ? `Live Music Venue · ${venue.address}`
    : 'Live Music Venue · St. Pete, FL';

  return new ImageResponse(
    ogImageTemplate({ title, subtitle, backgroundSrc, logoSrc }),
    { ...size },
  );
}
