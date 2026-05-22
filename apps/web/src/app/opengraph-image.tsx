import { ImageResponse } from 'next/og';
import { ogImageTemplate } from '@/lib/og/image-template';
import { readPublicImage } from '@/lib/og/read-public-image';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const backgroundSrc = readPublicImage('/images/hero/SPM-hero.png');
  const logoSrc = readPublicImage('/images/brand/spm-logo-cable-white.png');

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
