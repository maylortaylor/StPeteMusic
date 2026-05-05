const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
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
