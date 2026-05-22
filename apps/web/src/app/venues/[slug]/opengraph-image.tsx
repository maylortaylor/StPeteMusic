import { ImageResponse } from 'next/og';
import { ogImageTemplate } from '@/lib/og/image-template';
import { OG_BASE_URL } from '@/lib/og/base-url';
import { getVenueBySlug } from '@/lib/queries/venues';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug).catch(() => null);

  const backgroundSrc = venue?.hero_photo_url ?? `${OG_BASE_URL}/images/og/venues-bg2.png`;
  const logoSrc = `${OG_BASE_URL}/images/brand/spm-logo-cable-white.png`;

  const title = venue?.name ?? 'Live Music Venue';
  const subtitle = venue?.address
    ? `Live Music Venue · ${venue.address}`
    : 'Live Music Venue · St. Pete, FL';

  return new ImageResponse(
    ogImageTemplate({ title, subtitle, backgroundSrc, logoSrc }),
    { ...size },
  );
}
