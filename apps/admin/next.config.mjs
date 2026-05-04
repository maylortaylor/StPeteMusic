/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.stpetemusic.live',
      },
    ],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL ?? '',
  },
};

export default nextConfig;
