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
  reactStrictMode: true,
  devIndicators: false,
  // Turbopack rule for .md imports (Next.js 16+ uses Turbopack by default).
  turbopack: {
    rules: {
      '*.md': { loaders: ['raw-loader'], as: '*.js' },
    },
  },
  webpack(config) {
    // Fallback for any webpack-mode builds.
    config.module.rules.push({ test: /\.md$/, type: 'asset/source' });
    return config;
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  serverExternalPackages: ['pg', 'drizzle-orm', 'sharp'],
  experimental: {
    // Ensure sharp's linux-x64 native binary is traced into the deployment bundle.
    // Without this, Amplify WEB_COMPUTE omits the .node file and sharp fails at runtime.
    outputFileTracingIncludes: {
      '/api/upload/artist-image': [
        './node_modules/@img/sharp-linux-x64/**/*',
        './node_modules/@img/sharp-libvips-linux-x64/**/*',
      ],
    },
  },
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
