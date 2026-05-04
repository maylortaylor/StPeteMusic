/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pg', 'drizzle-orm'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.stpetemusic.live',
      },
    ],
  },
};

export default nextConfig;
