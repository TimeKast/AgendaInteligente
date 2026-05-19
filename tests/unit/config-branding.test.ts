/**
 * Branding Configuration Tests
 *
 * Tests for src/config/branding.ts centralized branding values.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock env module
vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_NAME: 'TestApp',
    NEXT_PUBLIC_APP_URL: 'https://test.example.com',
  }),
  getAppUrl: () => 'https://test.example.com',
}));

import { branding } from '@/config/branding';

describe('Branding Configuration', () => {
  it('exports appName', () => {
    expect(branding.appName).toBeDefined();
    expect(typeof branding.appName).toBe('string');
  });

  it('exports appTagline', () => {
    expect(branding.appTagline).toBeDefined();
    expect(typeof branding.appTagline).toBe('string');
  });

  it('exports appUrl', () => {
    expect(branding.appUrl).toBeDefined();
    expect(typeof branding.appUrl).toBe('string');
  });

  it('exports themeColor as valid hex', () => {
    expect(branding.themeColor).toBeDefined();
    expect(branding.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('exports backgroundColor as valid hex', () => {
    expect(branding.backgroundColor).toBeDefined();
    expect(branding.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('getClientLogo returns a string or null', () => {
    const logo = branding.getClientLogo();
    expect(typeof logo === 'string' || logo === null).toBe(true);
  });

  it('exports logo path', () => {
    expect(branding.logo).toBeDefined();
    expect(typeof branding.logo).toBe('string');
  });

  it('exports logoAlt', () => {
    expect(branding.logoAlt).toBeDefined();
    expect(typeof branding.logoAlt).toBe('string');
  });
});
