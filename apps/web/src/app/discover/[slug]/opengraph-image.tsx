import { ImageResponse } from 'next/og';
import { ogImageTemplate } from '@/lib/og/image-template';
import { readPublicImage } from '@/lib/og/read-public-image';
import { getArtistBySlug } from '@/lib/queries/artists';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug).catch(() => null);

  const backgroundSrc = artist?.hero_photo_url
    ? artist.hero_photo_url
    : readPublicImage('/images/og/discover-bg2.png');
  const logoSrc = readPublicImage('/images/brand/spm-logo-cable-white.png');

  const title = artist?.name ?? 'Discover Artists';
  const subtitle = artist
    ? `${artist.type} · St. Pete, FL`
    : 'Local artists from the Tampa Bay music scene';

  return new ImageResponse(
    ogImageTemplate({ title, subtitle, backgroundSrc, logoSrc }),
    { ...size },
  );
}
