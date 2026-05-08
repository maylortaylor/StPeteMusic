import { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for StPeteMusic.live — how we collect and use data.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Privacy Policy | St. Pete Music',
    description: 'Privacy policy for StPeteMusic.live — how we collect and use data.',
    url: 'https://www.stpetemusic.live/privacy',
    siteName: 'St. Pete Music',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | St. Pete Music',
    description: 'Privacy policy for StPeteMusic.live — how we collect and use data.',
  },
};

const LAST_UPDATED = 'May 2026';

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-inter font-black text-4xl sm:text-5xl text-black mb-3">
            Privacy Policy
          </h1>
          <p className="font-inter text-sm text-black/50 mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-lg max-w-none space-y-10 font-inter text-black/80">

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Who we are</h2>
              <p>
                StPeteMusic is a community hub for the St. Petersburg, FL music scene, operated by
                Tangent LLC in partnership with Suite E Studios. Our website is{' '}
                <a href="https://www.stpetemusic.live" className="text-brand-orange underline">
                  www.stpetemusic.live
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">What data we collect</h2>

              <h3 className="font-inter font-bold text-lg text-black mb-2">Analytics (Google Analytics 4)</h3>
              <p>
                We use Google Analytics 4 (GA4) via Google Tag Manager to understand how visitors
                use our site. GA4 collects:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Pages visited and time spent</li>
                <li>General location (country/city — not street-level)</li>
                <li>Browser type, device type, and operating system</li>
                <li>How you arrived at the site (search, social media, direct, etc.)</li>
                <li>Events you trigger (e.g., newsletter signups, link clicks)</li>
              </ul>
              <p className="mt-3">
                GA4 uses cookies to identify returning visitors. No personally identifiable
                information is sent to Google. Google&apos;s privacy policy:{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-orange underline"
                >
                  policies.google.com/privacy
                </a>
                .
              </p>

              <h3 className="font-inter font-bold text-lg text-black mt-6 mb-2">Newsletter signup</h3>
              <p>
                If you subscribe to our newsletter, we collect your email address. We use it only to
                send monthly event roundups for the St. Pete music scene. We use{' '}
                <a href="https://listmonk.app" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                  Listmonk
                </a>{' '}
                (self-hosted) and{' '}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                  Resend
                </a>{' '}
                to send email. Your address is never shared or sold.
              </p>

              <h3 className="font-inter font-bold text-lg text-black mt-6 mb-2">Contact form</h3>
              <p>
                If you use our contact form, we collect your name, email address, and message. This
                information is sent directly to our team and used only to respond to your inquiry.
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Cookies</h2>
              <p>
                We use cookies for analytics and audience insights. This includes Google Analytics
                (GA4) and Meta Pixel for conversion tracking. You can opt out of analytics tracking by:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>
                  Using a browser extension such as{' '}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-orange underline"
                  >
                    Google Analytics Opt-out Add-on
                  </a>
                </li>
                <li>Enabling &quot;Do Not Track&quot; in your browser settings</li>
                <li>Using a browser with built-in tracker blocking</li>
              </ul>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Data retention</h2>
              <p>
                Analytics data is retained for 14 months in Google Analytics, then automatically
                deleted. Newsletter subscribers can unsubscribe at any time via the link at the
                bottom of any email — your address is removed immediately.
              </p>
            </section>

            <section>
              <h2 className="font-inter font-black text-2xl text-black mb-3">Third-party services</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Google Analytics / GTM</strong> — analytics; governed by{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                    Google&apos;s Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>YouTube</strong> — embedded videos; governed by{' '}
                  <a href="https://www.youtube.com/t/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                    YouTube&apos;s Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>Resend</strong> — email delivery; governed by{' '}
                  <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                    Resend&apos;s Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>Meta Pixel (Facebook/Instagram)</strong> — conversion tracking and audience analytics; governed by{' '}
                  <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                    Meta&apos;s Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>Microsoft Clarity</strong> — session recording and heatmaps (page interactions, scroll behavior); governed by{' '}
                  <a href="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                    Microsoft&apos;s Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>TikTok</strong> — social media platform linked from this site; governed by{' '}
                  <a href="https://www.tiktok.com/legal/page/us/privacy-policy/en" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">
                    TikTok&apos;s Privacy Policy
                  </a>
                </li>
              </ul>
            </section>


          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <Link
              href="/"
              className="font-inter font-bold text-sm uppercase tracking-wide text-black/60 hover:text-black transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
