/**
 * Application Configuration
 *
 * Centralized app metadata and branding.
 * Values can be overridden via environment variables.
 */

import { getAppUrl } from '@/lib/env';

export const APP_CONFIG = {
  /** Application name */
  name: process.env.NEXT_PUBLIC_APP_NAME || 'TimeKast Starter Kit',

  /** Legal company/entity name */
  company: process.env.NEXT_PUBLIC_COMPANY_NAME || 'TimeKast',

  /** Country/jurisdiction for legal documents */
  country: process.env.NEXT_PUBLIC_COUNTRY || 'España',

  /** Application URL (auto-detects Vercel environment) */
  url: getAppUrl(),

  /** Contact emails */
  email: {
    legal: process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'legal@example.com',
    privacy: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'privacy@example.com',
    support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com',
  },

  /** Dynamic dates */
  dates: {
    /** Current date formatted for legal documents */
    updated: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  },
} as const;
