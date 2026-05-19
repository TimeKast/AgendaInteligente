import { describe, it, expect, vi } from 'vitest';
import { magicLinkEmail, magicLinkEmailText } from '@/lib/email/templates/magic-link';
import { passwordResetEmail, passwordResetEmailText } from '@/lib/email/templates/password-reset';

// Mock getEnv to avoid needing actual env vars during tests
vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_NAME: 'TimeKast Test',
    NEXT_PUBLIC_APP_URL: 'http://test.com',
  }),
  getAppUrl: () => 'http://test.com',
}));

describe('Email Templates', () => {
  describe('Magic Link', () => {
    const params = { url: 'https://timekast.com/auth/verify?token=123', host: 'timekast.com' };

    it('renders HTML correctly', () => {
      const html = magicLinkEmail(params);
      expect(html).toContain('TimeKast Test');
      expect(html).toContain(params.url);
      expect(html).toContain('Iniciar sesión');
      expect(html).toContain('<!DOCTYPE html>'); // Should wrap in layout
    });

    it('renders Text correctly', () => {
      const text = magicLinkEmailText(params);
      expect(text).toContain('TimeKast Test');
      expect(text).toContain(params.url);
      expect(text).not.toContain('<div>'); // Plain text check
    });
  });

  describe('Password Reset', () => {
    const params = {
      url: 'https://timekast.com/reset?token=xyz',
      userName: 'Edmond',
    };

    it('renders HTML with userName', () => {
      const html = passwordResetEmail(params);
      expect(html).toContain('Hola Edmond');
      expect(html).toContain(params.url);
      expect(html).toContain('Restablecer contraseña');
    });

    it('renders HTML without userName fallback', () => {
      const html = passwordResetEmail({ url: params.url });
      expect(html).toContain('Hola');
      // Should handle missing userName gracefully (check implementation detail if needed, usually defaults to "Hola")
    });

    it('renders Text correctly', () => {
      const text = passwordResetEmailText(params);
      expect(text).toContain(params.url);
    });
  });
});
