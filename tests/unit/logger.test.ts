/**
 * Logger Tests
 *
 * Tests for lib/logger.ts — structured logger with dev/prod formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll import the logger and test its behavior
import { logger } from '@/lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('warn', () => {
    it('calls console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('Test warning');
      expect(spy).toHaveBeenCalledOnce();
    });

    it('includes message in output', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('Test warning message');
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Test warning message'));
    });

    it('accepts context', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('Warning with context', { userId: 'u-123' });
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('error', () => {
    it('calls console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Test error');
      expect(spy).toHaveBeenCalledOnce();
    });

    it('includes message in output', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Something broke');
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Something broke'));
    });

    it('accepts LogContext object', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('DB Error', { action: 'query', correlationId: 'abc-123' });
      expect(spy).toHaveBeenCalledOnce();
    });

    it('handles non-object context gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Error', 'just a string' as unknown);
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('debug', () => {
    it('calls console.debug in dev mode', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug('Debug message');
      // In test environment (NODE_ENV=test), isDev = true, so should log
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('info', () => {
    it('calls console.info in dev mode', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('Info message');
      expect(spy).toHaveBeenCalledOnce();
    });

    it('accepts context with correlationId', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('With CID', { correlationId: 'test-cid-123456' });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('test-cid'));
    });
  });
});
