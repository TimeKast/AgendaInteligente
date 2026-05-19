import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import { withSerwist } from '@serwist/turbopack';

// =============================================================================
// Security Headers
// =============================================================================
// Applied to all routes by default. See docs/SECURITY.md for details.
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

// =============================================================================
// Next.js Configuration
// =============================================================================
const nextConfig: NextConfig = {
  // Empty turbopack config silences the webpack/turbopack warning
  turbopack: {},

  // Allow external images from OAuth providers (Google, GitHub, etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile pictures
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub profile pictures
      },
    ],
  },

  // Security headers for all routes
  async headers() {
    return [
      // Service Worker MUST NOT be cached by the browser.
      // Without this, Next.js serves sw.js with s-maxage=31536000 (1 year!)
      // which prevents the browser from ever detecting SW updates.
      {
        source: '/serwist/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Also cover /sw.js directly (in case the SW is served at this path)
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

// =============================================================================
// Sentry Configuration (only active if DSN is defined)
// =============================================================================
// PWA service worker is built separately by `serwist build` CLI (see serwist.config.js)
const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

const sentryConfig = sentryEnabled
  ? withSentryConfig(nextConfig, {
      // Sentry organization settings
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      // Silent build outputs
      silent: !process.env.CI,

      // Source maps (hidden in production)
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
    })
  : nextConfig;

// Wrap with Serwist for Turbopack SW compilation
export default withSerwist(sentryConfig);
