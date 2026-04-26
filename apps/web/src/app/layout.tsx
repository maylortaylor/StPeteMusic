import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'StPeteMusic — St. Petersburg FL Live Music',
  description:
    'Documenting, promoting, and showcasing local musicians and bands in the St. Petersburg, Florida area. YouTube shorts, live shows, and community events.',
  keywords: [
    'St Pete Music',
    'St Petersburg FL music',
    'live music',
    'local bands',
    'Suite E Studios',
    'Warehouse Arts District',
    'Tampa Bay music',
    'Final Friday',
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
    title: 'StPeteMusic — St. Petersburg FL Live Music',
    description: 'Live music from the St. Pete scene.',
    url: 'https://stpetemusic.com',
    siteName: 'StPeteMusic',
    type: 'website',
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
