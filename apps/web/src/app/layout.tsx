import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.stpetemusic.live'),
  title: {
    template: 'St. Pete Music | %s',
    default: 'St. Pete Music | Live Music in St. Petersburg, FL',
  },
  description:
    'The home for live music in St. Petersburg, FL. Discover local bands, find upcoming shows, and stay connected to the Tampa Bay music scene.',
  keywords: [
    'St Pete Music',
    'St Petersburg FL music',
    'live music',
    'local bands',
    'Suite E Studios',
    'Warehouse Arts District',
    'Tampa Bay music',
    'Final Friday',
    'Instant Noodles',
    'Florida live music',
  ],
  icons: {
    icon: [
      { url: '/images/brand/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/brand/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/brand/favicon/favicon.ico' },
    ],
    apple: '/images/brand/favicon/apple-touch-icon.png',
  },
  manifest: '/images/brand/favicon/site.webmanifest',
  openGraph: {
    title: 'St. Pete Music | Live Music in St. Petersburg, FL',
    description:
      'The home for live music in St. Petersburg, FL. Discover local bands, find upcoming shows, and stay connected to the Tampa Bay music scene.',
    url: 'https://www.stpetemusic.live',
    siteName: 'St. Pete Music',
    type: 'website',
    images: [
      {
        url: '/images/hero/hero-1.jpg',
        width: 1200,
        height: 630,
        alt: 'Live music at Suite E Studios — St. Pete Music',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-text-primary font-inter antialiased">
        {children}
      </body>
    </html>
  );
}
