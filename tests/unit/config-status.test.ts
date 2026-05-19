/**
 * Status Design Tokens Tests
 *
 * Tests for src/config/status.ts centralized status styling.
 */

import { describe, it, expect } from 'vitest';
import { STATUS_STYLES, getStatusStyle } from '@/config/status';

describe('Status Design Tokens', () => {
  describe('STATUS_STYLES', () => {
    it('defines active style', () => {
      expect(STATUS_STYLES.active).toBeDefined();
      expect(STATUS_STYLES.active.badge).toContain('emerald');
      expect(STATUS_STYLES.active.label).toBe('Activo');
    });

    it('defines inactive style', () => {
      expect(STATUS_STYLES.inactive).toBeDefined();
      expect(STATUS_STYLES.inactive.badge).toContain('red');
      expect(STATUS_STYLES.inactive.label).toBe('Inactivo');
    });

    it('each style has all required fields', () => {
      for (const [, style] of Object.entries(STATUS_STYLES)) {
        expect(style.badge).toBeDefined();
        expect(style.dot).toBeDefined();
        expect(style.text).toBeDefined();
        expect(style.label).toBeDefined();
      }
    });
  });

  describe('getStatusStyle', () => {
    it('returns active style for "active"', () => {
      const style = getStatusStyle('active');
      expect(style).toBe(STATUS_STYLES.active);
    });

    it('returns inactive style for "inactive"', () => {
      const style = getStatusStyle('inactive');
      expect(style).toBe(STATUS_STYLES.inactive);
    });

    it('returns default (slate) for unknown status', () => {
      const style = getStatusStyle('unknown');
      expect(style.label).toBe('Desconocido');
      expect(style.badge).toContain('slate');
    });

    it('returns default for empty string', () => {
      const style = getStatusStyle('');
      expect(style.label).toBe('Desconocido');
    });
  });
});
