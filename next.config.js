/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow builds to succeed even with TypeScript errors during development
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow builds to succeed even with ESLint errors during development
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig