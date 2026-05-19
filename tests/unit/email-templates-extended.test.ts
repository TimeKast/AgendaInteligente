/**
 * Additional Email Templates Tests
 *
 * Tests for templates not covered in existing email-templates.test.ts:
 * - invite-accepted, invite-user, login-alert, password-changed,
 *   password-reset-confirm, verify-email, layout utilities
 */

import { describe, it, expect, vi } from 'vitest';

// Mock env module
vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_NAME: 'TestApp',
    NEXT_PUBLIC_APP_URL: 'https://test.example.com',
    NEXT_PUBLIC_SUPPORT_EMAIL: 'support@test.com',
  }),
  getAppUrl: () => 'https://test.example.com',
}));

// --- Import after mocks ---
import {
  inviteAcceptedEmail,
  inviteAcceptedEmailText,
} from '@/lib/email/templates/invite-accepted';
import { inviteUserEmail, inviteUserEmailText } from '@/lib/email/templates/invite-user';
import {
  isLoginAlertEnabled,
  loginAlertEmail,
  loginAlertEmailText,
} from '@/lib/email/templates/login-alert';
import {
  passwordChangedEmail,
  passwordChangedEmailText,
} from '@/lib/email/templates/password-changed';
import {
  passwordResetConfirmEmail,
  passwordResetConfirmEmailText,
} from '@/lib/email/templates/password-reset-confirm';
import { verifyEmail, verifyEmailText } from '@/lib/email/templates/verify-email';
import { generateTextFallback, getEmailAssetUrl } from '@/lib/email/templates/layout';

describe('Invite Accepted Email', () => {
  it('renders HTML with user name', () => {
    const html = inviteAcceptedEmail({ userName: 'Juan' });
    expect(html).toContain('Hola Juan');
    expect(html).toContain('Bienvenido');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders HTML without user name', () => {
    const html = inviteAcceptedEmail();
    expect(html).toContain('Hola,');
    expect(html).toContain('Bienvenido');
  });

  it('renders HTML with organization name', () => {
    const html = inviteAcceptedEmail({ organizationName: 'MyCorp' });
    expect(html).toContain('MyCorp');
  });

  it('renders plain text', () => {
    const text = inviteAcceptedEmailText({ userName: 'Juan' });
    expect(text).toContain('Hola Juan');
    expect(text).toContain('dashboard');
    expect(text).not.toContain('<div>');
  });
});

describe('Invite User Email', () => {
  const params = { url: 'https://test.com/invite?token=abc', inviterName: 'Admin' };

  it('renders HTML with inviter name', () => {
    const html = inviteUserEmail(params);
    expect(html).toContain('Admin');
    expect(html).toContain(params.url);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders plain text', () => {
    const text = inviteUserEmailText(params);
    expect(text).toContain(params.url);
    expect(text).toContain('Admin');
    expect(text).not.toContain('<div>');
  });
});

describe('Login Alert Email', () => {
  it('isLoginAlertEnabled returns a boolean', () => {
    const result = isLoginAlertEnabled();
    expect(typeof result).toBe('boolean');
  });

  it('renders HTML with login details', () => {
    const html = loginAlertEmail({
      userName: 'Test',
      loginAt: new Date('2026-01-01T12:00:00Z'),
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
    });
    expect(html).toContain('192.168.1.1');
    expect(html).toContain('Chrome');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders plain text', () => {
    const text = loginAlertEmailText({
      userName: 'Test',
      loginAt: new Date('2026-01-01T12:00:00Z'),
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
    });
    expect(text).toContain('192.168.1.1');
    expect(text).not.toContain('<div>');
  });
});

describe('Password Changed Email', () => {
  it('renders HTML', () => {
    const html = passwordChangedEmail({
      userName: 'Test',
      changedAt: new Date('2026-01-01T12:00:00Z'),
    });
    expect(html).toContain('Test');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders HTML without username', () => {
    const html = passwordChangedEmail({ changedAt: new Date('2026-01-01T12:00:00Z') });
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders plain text', () => {
    const text = passwordChangedEmailText({
      userName: 'Test',
      changedAt: new Date('2026-01-01T12:00:00Z'),
    });
    expect(text).not.toContain('<div>');
  });
});

describe('Password Reset Confirm Email', () => {
  it('renders HTML', () => {
    const html = passwordResetConfirmEmail({
      userName: 'Test',
      changedAt: new Date('2026-01-01T12:00:00Z'),
    });
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders plain text', () => {
    const text = passwordResetConfirmEmailText({
      userName: 'Test',
      changedAt: new Date('2026-01-01T12:00:00Z'),
    });
    expect(text).not.toContain('<div>');
  });
});

describe('Verify Email Template', () => {
  it('renders HTML with verification URL', () => {
    const html = verifyEmail({ url: 'https://test.com/verify?token=xyz' });
    expect(html).toContain('https://test.com/verify?token=xyz');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders plain text', () => {
    const text = verifyEmailText({ url: 'https://test.com/verify?token=xyz' });
    expect(text).toContain('https://test.com/verify?token=xyz');
    expect(text).not.toContain('<div>');
  });
});

describe('Layout Utilities', () => {
  it('generateTextFallback strips HTML tags', () => {
    const text = generateTextFallback('<h1>Hello</h1><p>World</p>');
    expect(text).not.toContain('<h1>');
    expect(text).not.toContain('<p>');
    expect(text).toContain('Hello');
    expect(text).toContain('World');
  });

  it('getEmailAssetUrl returns a valid URL', () => {
    const url = getEmailAssetUrl('logo.png');
    expect(url).toContain('logo.png');
    expect(url).toContain('https://');
  });
});
