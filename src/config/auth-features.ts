/**
 * Auth Feature Flags Configuration
 *
 * Enable/disable authentication providers and features via environment variables.
 * Uses centralized env.ts for validated, type-safe access.
 *
 * @see ADR-007: Auth Framework Design
 */

import {
  getAuthFeatures,
  isGoogleOAuthConfigured,
  isGitHubOAuthConfigured,
  getEnv,
} from '@/lib/env';

// =============================================================================
// Types
// =============================================================================

export type AuthProvider = 'credentials' | 'email' | 'google' | 'github';

export interface AuthFeatures {
  providers: {
    /** Password-based authentication (bcrypt) */
    credentials: boolean;
    /** Magic link authentication (requires email provider) */
    email: boolean;
    /** Google OAuth */
    google: boolean;
    /** GitHub OAuth */
    github: boolean;
  };
  features: {
    /** Allow new user registration */
    registration: boolean;
    /** Allow password reset via email */
    passwordReset: boolean;
    /** Require email verification before access */
    emailVerification: boolean;
  };
}

// =============================================================================
// Auth Features Configuration (Lazy Loaded)
// =============================================================================

let _authFeaturesCache: AuthFeatures | null = null;

/**
 * Get auth features configuration (lazy loaded, cached)
 */
function getAuthFeaturesConfig(): AuthFeatures {
  if (_authFeaturesCache) return _authFeaturesCache;

  const flags = getAuthFeatures();

  _authFeaturesCache = {
    providers: {
      credentials: flags.password,
      email: flags.magicLink,
      google: flags.google,
      github: flags.github,
    },
    features: {
      registration: flags.registration,
      passwordReset: flags.passwordReset,
      emailVerification: flags.emailVerify,
    },
  };

  return _authFeaturesCache;
}

/**
 * Main auth features configuration object.
 * Lazy loaded from environment variables.
 *
 * @example
 * // Check if magic link is enabled
 * if (authFeatures.providers.email) {
 *   // Show magic link form
 * }
 */
export const authFeatures: AuthFeatures = new Proxy({} as AuthFeatures, {
  get(_, prop: string) {
    return getAuthFeaturesConfig()[prop as keyof AuthFeatures];
  },
});

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if at least one auth provider is enabled
 */
export function hasAuthEnabled(): boolean {
  const config = getAuthFeaturesConfig();
  return Object.values(config.providers).some(Boolean);
}

/**
 * Get list of enabled authentication providers
 */
export function getEnabledProviders(): AuthProvider[] {
  const config = getAuthFeaturesConfig();
  return (Object.entries(config.providers) as [AuthProvider, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([provider]) => provider);
}

/**
 * Check if a specific provider is enabled
 */
export function isProviderEnabled(provider: AuthProvider): boolean {
  const config = getAuthFeaturesConfig();
  return config.providers[provider] ?? false;
}

/**
 * Validate OAuth provider configuration
 * Throws if provider is "enabled" but keys are missing
 */
export function validateOAuthProviders(): void {
  const env = getEnv();

  // Check Google
  if (env.AUTH_GOOGLE_ID && !env.AUTH_GOOGLE_SECRET) {
    throw new Error('AUTH_GOOGLE_ID is set but AUTH_GOOGLE_SECRET is missing');
  }
  if (!env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    throw new Error('AUTH_GOOGLE_SECRET is set but AUTH_GOOGLE_ID is missing');
  }

  // Check GitHub
  if (env.AUTH_GITHUB_ID && !env.AUTH_GITHUB_SECRET) {
    throw new Error('AUTH_GITHUB_ID is set but AUTH_GITHUB_SECRET is missing');
  }
  if (!env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
    throw new Error('AUTH_GITHUB_SECRET is set but AUTH_GITHUB_ID is missing');
  }
}

/**
 * Get OAuth credentials (throws if not configured)
 */
export function getGoogleCredentials(): { clientId: string; clientSecret: string } {
  const env = getEnv();
  if (!isGoogleOAuthConfigured()) {
    throw new Error('Google OAuth not configured: missing AUTH_GOOGLE_ID or AUTH_GOOGLE_SECRET');
  }
  return {
    clientId: env.AUTH_GOOGLE_ID!,
    clientSecret: env.AUTH_GOOGLE_SECRET!,
  };
}

export function getGitHubCredentials(): { clientId: string; clientSecret: string } {
  const env = getEnv();
  if (!isGitHubOAuthConfigured()) {
    throw new Error('GitHub OAuth not configured: missing AUTH_GITHUB_ID or AUTH_GITHUB_SECRET');
  }
  return {
    clientId: env.AUTH_GITHUB_ID!,
    clientSecret: env.AUTH_GITHUB_SECRET!,
  };
}
