/**
 * Branding Configuration
 *
 * Central place to configure app branding (name, logos, tagline).
 * These can be overridden via environment variables for each project.
 *
 * IMPORTANT: Only NEXT_PUBLIC_* vars are used (client-safe).
 */

import { getAppUrl } from '@/lib/env';

export const branding = {
  /** App name shown in headers, auth screens, etc. */
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Mi App',

  /** Short tagline shown below app name */
  appTagline: process.env.NEXT_PUBLIC_APP_TAGLINE || '',

  /** App URL for links (auto-detects Vercel environment) */
  appUrl: getAppUrl(),

  /**
   * Primary logo for PWA/emails (deterministic, no runtime fallback)
   * Uses dark variant for emails (dark backgrounds)
   */
  logo:
    process.env.NEXT_PUBLIC_CLIENT_LOGO_DARK || '/assets/timekast/timekast-logo-silver-full.png',

  /** Logo alt text */
  logoAlt: process.env.NEXT_PUBLIC_APP_NAME || 'TimeKast',

  /**
   * Client logo variants for different themes
   * Recommended specs: PNG ~200x50px with transparent background
   */
  clientLogoLight: process.env.NEXT_PUBLIC_CLIENT_LOGO_LIGHT || null,
  clientLogoDark: process.env.NEXT_PUBLIC_CLIENT_LOGO_DARK || null,

  /** TimeKast branding paths */
  timekast: {
    logoBlue: '/assets/timekast/timekast-logo-blue.png',
    logoBlueText: '/assets/timekast/timekast-logo-blue-full.png',
    logoSilver: '/assets/timekast/timekast-logo-silver.png',
    logoSilverText: '/assets/timekast/timekast-logo-silver-full.png',
  },

  /** Get the appropriate TimeKast logo based on theme */
  getTimeKastLogo: (variant: 'icon' | 'full' = 'full', theme?: string) => {
    // Use blue for light theme, silver for dark themes (midnight/dark)
    const validTheme =
      theme === 'light' || theme === 'midnight' || theme === 'dark' ? theme : 'midnight';
    const color = validTheme === 'light' ? 'blue' : 'silver';
    const suffix = variant === 'full' ? '-full' : '';
    return `/assets/timekast/timekast-logo-${color}${suffix}.png`;
  },

  /** Get the appropriate client logo based on theme */
  getClientLogo: (theme?: string): string | null => {
    const isDark = theme !== 'light';
    const logo = isDark
      ? process.env.NEXT_PUBLIC_CLIENT_LOGO_DARK
      : process.env.NEXT_PUBLIC_CLIENT_LOGO_LIGHT;
    return logo || null;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PWA / Meta theme colors
  // Used by manifest.ts and layout.tsx — change here to update everywhere.
  // ─────────────────────────────────────────────────────────────────────────

  /** Primary brand color for PWA theme_color and viewport meta */
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR || '#1e40af',

  /** Background color for PWA splash screen (matches midnight theme) */
  backgroundColor: process.env.NEXT_PUBLIC_BG_COLOR || '#0a1628',
} as const;
