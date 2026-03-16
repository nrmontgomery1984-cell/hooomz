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
    return [
      {
        source: '/',
        destination: '/interiors',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'hooomz.ca',
          },
        ],
      },
      {
        source: '/',
        destination: '/interiors',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'www.hooomz.ca',
          },
        ],
      },
    ];
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
    ];
  },
}

module.exports = nextConfig
