import type { Metadata } from 'next';
import { Montserrat, Oswald, Open_Sans } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-montserrat',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-oswald',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-open-sans',
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
    <html
      lang="en"
      className={`${montserrat.variable} ${oswald.variable} ${openSans.variable}`}
    >
      <body className="bg-background text-white font-open-sans antialiased">
        {children}
      </body>
    </html>
  );
}
