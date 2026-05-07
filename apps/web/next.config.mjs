// Content Security Policy
// next/font/google self-hosts fonts → font-src 'self' is sufficient
// GTM requires unsafe-inline (injects inline scripts into the page)
// Google Maps API loaded via @vis.gl/react-google-maps
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://connect.facebook.net https://www.clarity.ms",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://i.ytimg.com https://img.youtube.com https://maps.googleapis.com https://maps.gstatic.com https://www.facebook.com",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://region1.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://*.facebook.net https://*.clarity.ms",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy',   value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/videos/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
    minimumCacheTTL: 31536000,
  },
  // Amplify Gen 1 passes app-level env vars to the build process but does NOT
  // automatically inject server-only (non-NEXT_PUBLIC_) vars into the SSR Lambda
  // runtime environment. Using next.config `env` causes Next.js to inline these
  // values at build time via webpack DefinePlugin, so they are always present
  // in the Lambda regardless of Amplify's runtime injection behaviour.
  env: {
    LISTMONK_API_URL: process.env.LISTMONK_API_URL ?? 'https://listmonk.stpetemusic.live',
    LISTMONK_LIST_ID: process.env.LISTMONK_LIST_ID ?? '1',
    LISTMONK_USERNAME: process.env.LISTMONK_USERNAME ?? 'admin',
    LISTMONK_PASSWORD: process.env.LISTMONK_PASSWORD ?? '',
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  },
};

export default nextConfig;
