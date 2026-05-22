import { ImageResponse } from 'next/og';
import { ogImageTemplate } from '@/lib/og/image-template';
import { OG_BASE_URL } from '@/lib/og/base-url';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const backgroundSrc = `${OG_BASE_URL}/images/hero/SPM-hero.png`;
  const logoSrc = `${OG_BASE_URL}/images/brand/spm-logo-cable-white.png`;

  return new ImageResponse(
    ogImageTemplate({
      title: 'Live Music in St. Pete, FL',
      subtitle: 'Discover local bands, find upcoming shows, and stay connected to the Tampa Bay music scene.',
      backgroundSrc,
      logoSrc,
    }),
    { ...size },
  );
}
