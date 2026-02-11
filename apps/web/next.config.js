/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ESLint 9 incompatible with Next.js 14 internal lint runner.
    // Lint runs separately via `pnpm lint`.
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@hooomz/shared-contracts',
    '@hooomz/core',
    '@hooomz/estimating',
    '@hooomz/scheduling',
    '@hooomz/customers',
    '@hooomz/field-docs',
    '@hooomz/reporting',
  ],
}

module.exports = nextConfig
