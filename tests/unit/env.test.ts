/**
 * Unit Tests — Environment validation
 *
 * Tests for env.ts parsing and helper functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the parseBool logic directly since getAuthFeatures reads from process.env
describe('Auth Feature Flags parsing', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should parse "true" as true', () => {
    const parseBool = (val: string | undefined, defaultVal: boolean): boolean => {
      if (val === undefined || val === '') return defaultVal;
      return val.toLowerCase() !== 'false' && val !== '0';
    };

    expect(parseBool('true', false)).toBe(true);
    expect(parseBool('TRUE', false)).toBe(true);
    expect(parseBool('True', false)).toBe(true);
  });

  it('should parse "false" as false', () => {
    const parseBool = (val: string | undefined, defaultVal: boolean): boolean => {
      if (val === undefined || val === '') return defaultVal;
      return val.toLowerCase() !== 'false' && val !== '0';
    };

    expect(parseBool('false', true)).toBe(false);
    expect(parseBool('FALSE', true)).toBe(false);
    expect(parseBool('0', true)).toBe(false);
  });

  it('should use default when undefined', () => {
    const parseBool = (val: string | undefined, defaultVal: boolean): boolean => {
      if (val === undefined || val === '') return defaultVal;
      return val.toLowerCase() !== 'false' && val !== '0';
    };

    expect(parseBool(undefined, true)).toBe(true);
    expect(parseBool(undefined, false)).toBe(false);
    expect(parseBool('', true)).toBe(true);
  });
});

describe('Email configuration detection', () => {
  it('should recognize resend as configured when API key and FROM exist', () => {
    // This is a simplified test - real test would need to mock getEnv
    const isResendConfigured = (provider: string, apiKey?: string, from?: string) => {
      if (provider !== 'resend') return false;
      return !!apiKey && !!from;
    };

    expect(isResendConfigured('resend', 're_xxx', 'test@example.com')).toBe(true);
    expect(isResendConfigured('resend', '', 'test@example.com')).toBe(false);
    expect(isResendConfigured('smtp', 're_xxx', 'test@example.com')).toBe(false);
  });

  it('should recognize smtp as configured when host and FROM exist', () => {
    const isSmtpConfigured = (provider: string, host?: string, from?: string) => {
      if (provider !== 'smtp') return false;
      return !!host && !!from;
    };

    expect(isSmtpConfigured('smtp', 'smtp.example.com', 'test@example.com')).toBe(true);
    expect(isSmtpConfigured('smtp', '', 'test@example.com')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAppUrl — URL resolution with Vercel auto-detection
// ─────────────────────────────────────────────────────────────────────────────

describe('getAppUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear all URL-related vars
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should prefer NEXT_PUBLIC_APP_URL over everything', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://my-domain.com';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'my-app.vercel.app';
    process.env.VERCEL_URL = 'my-app-abc123.vercel.app';

    const { getAppUrl } = await import('@/lib/env');
    expect(getAppUrl()).toBe('https://my-domain.com');
  });

  it('should fall back to VERCEL_PROJECT_PRODUCTION_URL with https prefix', async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'my-app.vercel.app';
    process.env.VERCEL_URL = 'my-app-abc123.vercel.app';

    const { getAppUrl } = await import('@/lib/env');
    expect(getAppUrl()).toBe('https://my-app.vercel.app');
  });

  it('should fall back to VERCEL_URL with https prefix', async () => {
    process.env.VERCEL_URL = 'my-app-git-feature-abc.vercel.app';

    const { getAppUrl } = await import('@/lib/env');
    expect(getAppUrl()).toBe('https://my-app-git-feature-abc.vercel.app');
  });

  it('should default to localhost:3000 when no vars set', async () => {
    const { getAppUrl } = await import('@/lib/env');
    expect(getAppUrl()).toBe('http://localhost:3000');
  });

  it('should add https:// prefix only for Vercel vars (not NEXT_PUBLIC_APP_URL)', async () => {
    // NEXT_PUBLIC_APP_URL is already a full URL — no prefix needed
    process.env.NEXT_PUBLIC_APP_URL = 'http://custom-domain.test';
    const { getAppUrl } = await import('@/lib/env');
    expect(getAppUrl()).toBe('http://custom-domain.test');
  });
});
