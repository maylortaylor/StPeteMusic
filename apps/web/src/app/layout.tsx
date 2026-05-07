import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
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
        url: '/images/hero/SPM-hero.webp',
        width: 1456,
        height: 816,
        alt: 'Live music at Suite E Studios — St. Pete Music',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@StPeteMusic',
    creator: '@StPeteMusic',
    images: ['https://www.stpetemusic.live/images/hero/SPM-hero.webp'],
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
      <Script
        id="gtm-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments)}
            var consented = false;
            try { consented = localStorage.getItem('spm_cookie_consent') === 'accepted'; } catch(e) {}
            gtag('consent', 'default', {
              analytics_storage: consented ? 'granted' : 'denied',
              ad_storage: consented ? 'granted' : 'denied',
              ad_user_data: consented ? 'granted' : 'denied',
              ad_personalization: consented ? 'granted' : 'denied',
              wait_for_update: 500
            });
          `,
        }}
      />
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
      {process.env.NEXT_PUBLIC_CLARITY_ID && (
        <Script
          id="ms-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `,
          }}
        />
      )}
      <body className="bg-background text-text-primary font-inter antialiased">
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
