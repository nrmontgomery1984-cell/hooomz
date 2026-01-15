/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
