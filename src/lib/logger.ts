/**
 * Structured Logger
 *
 * Enhanced logger with:
 * - JSON output in production (for log aggregators)
 * - Pretty print in development
 * - Context metadata (userId, action, etc.)
 * - Backwards compatible API
 *
 * @example
 * import { logger } from '@/lib/logger';
 *
 * // Simple usage (backwards compatible)
 * logger.info('User logged in');
 *
 * // With context
 * logger.info('User logged in', { userId: '123', action: 'login' });
 *
 * @see OBS-003
 */

// =============================================================================
// Configuration
// =============================================================================

const isDev = process.env.NODE_ENV !== 'production';

// =============================================================================
// Log Context Types
// =============================================================================

export interface LogContext {
  /** Request/trace correlation ID */
  correlationId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Action being performed */
  action?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface StructuredLog {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

// =============================================================================
// Formatting
// =============================================================================

function formatLog(level: LogLevel, message: string, context?: LogContext | unknown): string {
  // Handle backwards compatibility: if context is not an object, ignore it
  const ctx: LogContext | undefined =
    context && typeof context === 'object' && !Array.isArray(context)
      ? (context as LogContext)
      : undefined;

  const log: StructuredLog = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...ctx,
  };

  if (isDev) {
    // Pretty print for development
    const prefix = `[${level.toUpperCase()}]`;
    const cid = ctx?.correlationId ? ` [${ctx.correlationId.slice(0, 8)}]` : '';
    return `${prefix}${cid} ${message}`;
  }

  // JSON for production (log aggregators)
  return JSON.stringify(log);
}

// =============================================================================
// Logger Implementation
// =============================================================================

export const logger = {
  /**
   * Debug level - only in development
   */
  debug: (message: string, context?: LogContext | unknown) => {
    if (isDev) console.debug(formatLog('debug', message, context));
  },

  /**
   * Info level - only in development
   */
  info: (message: string, context?: LogContext | unknown) => {
    if (isDev) console.info(formatLog('info', message, context));
  },

  /**
   * Warn level - always logs
   */
  warn: (message: string, context?: LogContext | unknown) => {
    console.warn(formatLog('warn', message, context));
  },

  /**
   * Error level - always logs
   */
  error: (message: string, context?: LogContext | unknown) => {
    console.error(formatLog('error', message, context));
  },
};
