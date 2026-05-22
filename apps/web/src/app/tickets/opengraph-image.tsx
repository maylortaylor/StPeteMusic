import { ImageResponse } from 'next/og';
import { ogImageTemplate } from '@/lib/og/image-template';
import { OG_BASE_URL } from '@/lib/og/base-url';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const backgroundSrc = `${OG_BASE_URL}/images/og/tickets-bg2.png`;
  const logoSrc = `${OG_BASE_URL}/images/brand/spm-logo-cable-white.png`;

  return new ImageResponse(
    ogImageTemplate({
      title: 'Get Your Tickets',
      subtitle: 'Upcoming shows in St. Pete, FL — powered by Eventbrite',
      backgroundSrc,
      logoSrc,
    }),
    { ...size },
  );
}
