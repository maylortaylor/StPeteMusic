import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleTagManager } from '@next/third-parties/google';
import { CookieBanner } from '@/components/CookieBanner';
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
    // Brand
    'St Pete Music',
    // Live music — core
    'live music St Pete',
    'live music St Petersburg FL',
    'live music tonight St Petersburg',
    'live music this weekend St Pete',
    // Nightlife / things to do
    'St Pete nightlife',
    'things to do in St Petersburg FL',
    'things to do in St Pete tonight',
    'best bars St Pete',
    'date night St Petersburg FL',
    // Music venues
    'music venues St Petersburg FL',
    'bars with live music St Pete',
    'concert venues St Petersburg Florida',
    'brewery live music St Pete',
    // Local artists & bands
    'St Pete bands',
    'local bands St Petersburg Florida',
    'Tampa Bay musicians',
    'St Petersburg FL music artists',
    // Events & concerts
    'concerts St Petersburg FL',
    'music events Tampa Bay',
    'Final Friday St Pete',
    'upcoming shows St Petersburg',
    'free concerts St Petersburg FL',
    // Geographic variants
    'Tampa Bay music',
    'Tampa Bay nightlife',
    'downtown St Pete music',
    'St Petersburg Florida music scene',
    // Neighborhoods & partners
    'EDGE District St Pete',
    'Suite E Studios',
    'Warehouse Arts District',
    // Broader reach
    'Florida live music',
  ],
  other: {
    'facebook-domain-verification': 'hazlmxxsqoiyfaryx63ql5xcaeubr5',
  },
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
  twitter: {
    card: 'summary_large_image',
    site: '@StPeteMusic',
    creator: '@StPeteMusic',
    images: ['https://www.stpetemusic.live/images/hero/hero-1.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#FF8C00" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      </head>
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <body className="bg-background text-text-primary font-inter antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
