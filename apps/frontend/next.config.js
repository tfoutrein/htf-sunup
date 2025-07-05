/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
  },
  // Configuration HTTPS pour le développement
  ...(process.env.NODE_ENV === 'development' && {
    server: {
      https: true,
    },
  }),
};

module.exports = nextConfig;
