/**
 * Sentry Server Configuration
 *
 * Only active if NEXT_PUBLIC_SENTRY_DSN is defined.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Debug
  debug: false,
});
