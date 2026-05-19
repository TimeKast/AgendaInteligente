/**
 * Auth Features Configuration Tests
 *
 * Tests for src/config/auth-features.ts feature flags and utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
const mockGetAuthFeatures = vi.fn();
const mockGetEnv = vi.fn();
const mockIsGoogleConfigured = vi.fn();
const mockIsGitHubConfigured = vi.fn();

vi.mock('@/lib/env', () => ({
  getAuthFeatures: () => mockGetAuthFeatures(),
  getEnv: () => mockGetEnv(),
  isGoogleOAuthConfigured: () => mockIsGoogleConfigured(),
  isGitHubOAuthConfigured: () => mockIsGitHubConfigured(),
}));

describe('Auth Features Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Default: all providers enabled
    mockGetAuthFeatures.mockReturnValue({
      password: true,
      magicLink: true,
      google: true,
      github: true,
      registration: true,
      passwordReset: true,
      emailVerify: false,
    });
  });

  describe('hasAuthEnabled', () => {
    it('returns true when at least one provider is enabled', async () => {
      const { hasAuthEnabled } = await import('@/config/auth-features');
      expect(hasAuthEnabled()).toBe(true);
    });

    it('returns false when all providers are disabled', async () => {
      mockGetAuthFeatures.mockReturnValue({
        password: false,
        magicLink: false,
        google: false,
        github: false,
        registration: false,
        passwordReset: false,
        emailVerify: false,
      });
      const { hasAuthEnabled } = await import('@/config/auth-features');
      expect(hasAuthEnabled()).toBe(false);
    });
  });

  describe('getEnabledProviders', () => {
    it('returns all enabled providers', async () => {
      const { getEnabledProviders } = await import('@/config/auth-features');
      const providers = getEnabledProviders();
      expect(providers).toContain('credentials');
      expect(providers).toContain('email');
      expect(providers).toContain('google');
      expect(providers).toContain('github');
    });

    it('returns only enabled providers', async () => {
      mockGetAuthFeatures.mockReturnValue({
        password: true,
        magicLink: false,
        google: false,
        github: true,
        registration: true,
        passwordReset: true,
        emailVerify: false,
      });
      const { getEnabledProviders } = await import('@/config/auth-features');
      const providers = getEnabledProviders();
      expect(providers).toEqual(['credentials', 'github']);
    });

    it('returns empty array when none enabled', async () => {
      mockGetAuthFeatures.mockReturnValue({
        password: false,
        magicLink: false,
        google: false,
        github: false,
        registration: false,
        passwordReset: false,
        emailVerify: false,
      });
      const { getEnabledProviders } = await import('@/config/auth-features');
      expect(getEnabledProviders()).toEqual([]);
    });
  });

  describe('isProviderEnabled', () => {
    it('returns true for enabled provider', async () => {
      const { isProviderEnabled } = await import('@/config/auth-features');
      expect(isProviderEnabled('credentials')).toBe(true);
    });

    it('returns false for disabled provider', async () => {
      mockGetAuthFeatures.mockReturnValue({
        password: false,
        magicLink: true,
        google: false,
        github: false,
        registration: false,
        passwordReset: false,
        emailVerify: false,
      });
      const { isProviderEnabled } = await import('@/config/auth-features');
      expect(isProviderEnabled('credentials')).toBe(false);
      expect(isProviderEnabled('email')).toBe(true);
    });
  });

  describe('validateOAuthProviders', () => {
    it('does not throw when OAuth is properly configured', async () => {
      mockGetEnv.mockReturnValue({
        AUTH_GOOGLE_ID: 'id',
        AUTH_GOOGLE_SECRET: 'secret',
        AUTH_GITHUB_ID: 'id',
        AUTH_GITHUB_SECRET: 'secret',
      });
      const { validateOAuthProviders } = await import('@/config/auth-features');
      expect(() => validateOAuthProviders()).not.toThrow();
    });

    it('throws when Google ID is set but Secret is missing', async () => {
      mockGetEnv.mockReturnValue({
        AUTH_GOOGLE_ID: 'id',
        AUTH_GOOGLE_SECRET: undefined,
        AUTH_GITHUB_ID: undefined,
        AUTH_GITHUB_SECRET: undefined,
      });
      const { validateOAuthProviders } = await import('@/config/auth-features');
      expect(() => validateOAuthProviders()).toThrow('AUTH_GOOGLE_SECRET is missing');
    });

    it('throws when Google Secret is set but ID is missing', async () => {
      mockGetEnv.mockReturnValue({
        AUTH_GOOGLE_ID: undefined,
        AUTH_GOOGLE_SECRET: 'secret',
        AUTH_GITHUB_ID: undefined,
        AUTH_GITHUB_SECRET: undefined,
      });
      const { validateOAuthProviders } = await import('@/config/auth-features');
      expect(() => validateOAuthProviders()).toThrow('AUTH_GOOGLE_ID is missing');
    });

    it('throws when GitHub ID is set but Secret is missing', async () => {
      mockGetEnv.mockReturnValue({
        AUTH_GOOGLE_ID: undefined,
        AUTH_GOOGLE_SECRET: undefined,
        AUTH_GITHUB_ID: 'id',
        AUTH_GITHUB_SECRET: undefined,
      });
      const { validateOAuthProviders } = await import('@/config/auth-features');
      expect(() => validateOAuthProviders()).toThrow('AUTH_GITHUB_SECRET is missing');
    });

    it('does not throw when no OAuth is configured', async () => {
      mockGetEnv.mockReturnValue({
        AUTH_GOOGLE_ID: undefined,
        AUTH_GOOGLE_SECRET: undefined,
        AUTH_GITHUB_ID: undefined,
        AUTH_GITHUB_SECRET: undefined,
      });
      const { validateOAuthProviders } = await import('@/config/auth-features');
      expect(() => validateOAuthProviders()).not.toThrow();
    });
  });

  describe('getGoogleCredentials', () => {
    it('returns credentials when configured', async () => {
      mockIsGoogleConfigured.mockReturnValue(true);
      mockGetEnv.mockReturnValue({
        AUTH_GOOGLE_ID: 'google-id',
        AUTH_GOOGLE_SECRET: 'google-secret',
      });
      const { getGoogleCredentials } = await import('@/config/auth-features');
      const creds = getGoogleCredentials();
      expect(creds.clientId).toBe('google-id');
      expect(creds.clientSecret).toBe('google-secret');
    });

    it('throws when not configured', async () => {
      mockIsGoogleConfigured.mockReturnValue(false);
      const { getGoogleCredentials } = await import('@/config/auth-features');
      expect(() => getGoogleCredentials()).toThrow('Google OAuth not configured');
    });
  });

  describe('getGitHubCredentials', () => {
    it('returns credentials when configured', async () => {
      mockIsGitHubConfigured.mockReturnValue(true);
      mockGetEnv.mockReturnValue({
        AUTH_GITHUB_ID: 'gh-id',
        AUTH_GITHUB_SECRET: 'gh-secret',
      });
      const { getGitHubCredentials } = await import('@/config/auth-features');
      const creds = getGitHubCredentials();
      expect(creds.clientId).toBe('gh-id');
      expect(creds.clientSecret).toBe('gh-secret');
    });

    it('throws when not configured', async () => {
      mockIsGitHubConfigured.mockReturnValue(false);
      const { getGitHubCredentials } = await import('@/config/auth-features');
      expect(() => getGitHubCredentials()).toThrow('GitHub OAuth not configured');
    });
  });
});
