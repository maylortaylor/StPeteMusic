/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
};

export default nextConfig;
