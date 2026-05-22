import { ImageResponse } from 'next/og';
import { ogImageTemplate } from '@/lib/og/image-template';
import { readPublicImage } from '@/lib/og/read-public-image';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const backgroundSrc = readPublicImage('/images/og/discover-bg2.png');
  const logoSrc = readPublicImage('/images/brand/spm-logo-cable-white.png');

  return new ImageResponse(
    ogImageTemplate({
      title: 'Discover Local Artists',
      subtitle: 'Bands, DJs & creatives from the Tampa Bay music scene',
      backgroundSrc,
      logoSrc,
    }),
    { ...size },
  );
}
