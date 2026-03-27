/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ESLint 9 incompatible with Next.js 14 internal lint runner.
    // Lint runs separately via `pnpm lint`.
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@hooomz/shared',
    '@hooomz/shared-contracts',
    '@hooomz/core',
    '@hooomz/estimating',
    '@hooomz/scheduling',
    '@hooomz/customers',
    '@hooomz/field-docs',
    '@hooomz/reporting',
  ],
  async redirects() {
    return [];
  },
  async rewrites() {
    return [
      {
        source: '/interiors',
        destination: '/interiors-landing.html',
      },
      {
        source: '/interiors/intake',
        destination: '/interiors/intake/index.html',
      },
      {
        source: '/interiors/process',
        destination: '/interiors/process.html',
      },
      {
        source: '/interiors/floorplan',
        destination: '/interiors/floorplan/index.html',
      },
      {
        source: '/interiors/passport',
        destination: '/interiors/passport/index.html',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/interiors-landing.html',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=300, must-revalidate' }],
      },
      {
        source: '/interiors/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=300, must-revalidate' }],
      },
    ];
  },
}

module.exports = nextConfig
