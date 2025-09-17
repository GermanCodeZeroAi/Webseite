/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Enable modern bundling
    esmExternals: true,
    // Enable server components
    serverComponents: true,
    // Enable app directory
    appDir: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Preconnect to external services
          {
            key: 'Link',
            value: '<https://js.stripe.com>; rel=preconnect; crossorigin, <https://api.stripe.com>; rel=preconnect; crossorigin, <https://fonts.googleapis.com>; rel=preconnect; crossorigin, <https://fonts.gstatic.com>; rel=preconnect; crossorigin',
          },
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/(.*\\.(jpg|jpeg|png|webp|avif|svg|ico))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize chunks
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunk for external libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // React chunk
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
            // Three.js chunk (if used)
            three: {
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              name: 'three',
              chunks: 'all',
              priority: 15,
            },
            // Common chunk
            common: {
              minChunks: 2,
              chunks: 'all',
              name: 'common',
              priority: 5,
            },
          },
        },
      };

      // Bundle analyzer in development
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: '../bundle-report.html',
          })
        );
      }
    }

    // Add webpack aliases for better tree shaking
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '/workspace/apps/frontend',
      '@/components': '/workspace/apps/frontend/components',
      '@/lib': '/workspace/apps/frontend/lib',
    };

    return config;
  },

  // Output configuration
  output: 'standalone',

  // Performance budgets
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Compression
  compress: true,

  // Power by header removal
  poweredByHeader: false,

  // Generate ETags for better caching
  generateEtags: true,

  // Minify HTML
  minify: process.env.NODE_ENV === 'production',

  // Optimize CSS
  optimizeCss: true,

  // Enable SWC minification
  swcMinify: true,

  // Transpile specific packages if needed
  transpilePackages: [],

  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Redirects for SEO
  async redirects() {
    return [
      // Add redirects here if needed
    ];
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      // Add rewrites here if needed
    ];
  },
};

module.exports = nextConfig;