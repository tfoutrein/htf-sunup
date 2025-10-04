/**
 * Configuration Next.js optimisée pour les performances
 *
 * Installation:
 * 1. Comparer avec votre next.config.js actuel
 * 2. Fusionner les configurations
 * 3. Redémarrer le serveur de dev
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration API
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },

  // Optimisation des images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.idrivee2-11.com',
        pathname: '/**',
      },
    ],
  },

  // Compression
  compress: true,

  // Optimisation du build
  swcMinify: true,

  // Headers de cache
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Configuration de production
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
    // Monitoring des Web Vitals
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },
};

module.exports = nextConfig;
