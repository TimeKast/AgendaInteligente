/**
 * Rate Limiting Module
 *
 * Provides rate limiting for auth endpoints.
 *
 * Strategy (decision tree, see `checkRateLimit`):
 * 1. RATE_LIMIT_ENABLED=false → bypass entirely (debug / E2E / kill-switch)
 * 2. UPSTASH_REDIS_REST_URL configured → Upstash (lowest latency, global)
 * 3. DATABASE_URL configured + NODE_ENV=production → Postgres (multi-instance safe)
 * 4. Fallback → in-memory Map (single-instance dev only)
 *
 * Postgres backend uses an atomic INSERT ... ON CONFLICT DO UPDATE with CASE
 * (see `postgresRateLimit`). Cleanup is probabilistic (1/100 chance per call) —
 * if the project ships cron jobs, replace with a daily `cleanup-rate-limit-buckets`.
 *
 * @see KIT-020 §D, §E
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitConfig {
  requests: number;
  windowSeconds: number;
  prefix: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const isUpstashConfigured = (): boolean => {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
};

const isPostgresAvailable = (): boolean => {
  return !!process.env.DATABASE_URL;
};

const isRateLimitEnabled = (): boolean => {
  // Default ON. Off only when explicitly set to 'false' (debug / E2E / kill-switch).
  return process.env.RATE_LIMIT_ENABLED !== 'false';
};

// Default limits (can be overridden via env vars)
const LIMITS = {
  forgotPassword: {
    requests: parseInt(process.env.RATE_LIMIT_FORGOT_PASSWORD_REQUESTS || '5', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_FORGOT_PASSWORD_WINDOW_SECONDS || '60', 10),
    prefix: 'ratelimit:forgot-password',
  },
  resetPassword: {
    requests: parseInt(process.env.RATE_LIMIT_RESET_PASSWORD_REQUESTS || '10', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_RESET_PASSWORD_WINDOW_SECONDS || '60', 10),
    prefix: 'ratelimit:reset-password',
  },
  auth: {
    requests: parseInt(process.env.RATE_LIMIT_AUTH_REQUESTS || '10', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS || '60', 10),
    prefix: 'ratelimit:auth',
  },
  register: {
    requests: parseInt(process.env.RATE_LIMIT_REGISTER_REQUESTS || '3', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW_SECONDS || '3600', 10),
    prefix: 'ratelimit:register',
  },
  inviteToken: {
    requests: parseInt(process.env.RATE_LIMIT_INVITE_REQUESTS || '30', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_INVITE_WINDOW_SECONDS || '60', 10),
    prefix: 'ratelimit:invite',
  },
  voiceTranscribe: {
    // ISSUE-072: 60 transcribe / hour / user. Bound at the user
    // identifier (not IP) since the route is auth-required.
    requests: parseInt(process.env.RATE_LIMIT_VOICE_TRANSCRIBE_REQUESTS || '60', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_VOICE_TRANSCRIBE_WINDOW_SECONDS || '3600', 10),
    prefix: 'ratelimit:voice-transcribe',
  },
  aiParseTask: {
    // ISSUE-073: 200 parse / hour / user.
    requests: parseInt(process.env.RATE_LIMIT_AI_PARSE_REQUESTS || '200', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_AI_PARSE_WINDOW_SECONDS || '3600', 10),
    prefix: 'ratelimit:ai-parse',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Rate Limiter (Development / Small Apps)
// ─────────────────────────────────────────────────────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of memoryStore.entries()) {
        if (now > entry.resetAt) {
          memoryStore.delete(key);
        }
      }
    },
    5 * 60 * 1000
  );
}

function memoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const fullKey = `${config.prefix}:${key}`;
  const entry = memoryStore.get(fullKey);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(fullKey, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset: Math.floor((now + windowMs) / 1000),
    };
  }

  if (entry.count >= config.requests) {
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      reset: Math.floor(entry.resetAt / 1000),
    };
  }

  entry.count++;
  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    reset: Math.floor(entry.resetAt / 1000),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Upstash Rate Limiter (Production)
// ─────────────────────────────────────────────────────────────────────────────

let upstashRateLimiters: Map<string, Ratelimit> | null = null;

function getUpstashRateLimiter(config: RateLimitConfig): Ratelimit {
  if (!upstashRateLimiters) {
    upstashRateLimiters = new Map();
  }

  if (!upstashRateLimiters.has(config.prefix)) {
    const redis = Redis.fromEnv();
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds} s`),
      analytics: true,
      prefix: config.prefix,
    });
    upstashRateLimiters.set(config.prefix, limiter);
  }

  return upstashRateLimiters.get(config.prefix)!;
}

async function upstashRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const limiter = getUpstashRateLimiter(config);
  const result = await limiter.limit(key);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Postgres Rate Limiter (Production fallback when no Upstash)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atomic Postgres-backed rate limiter.
 *
 * Uses a single INSERT ... ON CONFLICT DO UPDATE with CASE WHEN to avoid race
 * conditions: insert if missing, reset to 1 if window expired (`reset_at <= now()`),
 * otherwise increment. Returns the resulting count + reset_at.
 *
 * Cleanup is probabilistic (1/100 chance) and wrapped in try/catch — if it
 * fails, the rate-limit decision is already made and we don't tank the request.
 */
async function postgresRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const fullKey = `${config.prefix}:${key}`;
  const windowSeconds = config.windowSeconds;

  const result = await db.execute(sql`
    INSERT INTO rate_limit_buckets (key, count, reset_at)
    VALUES (
      ${fullKey},
      1,
      now() + (${windowSeconds.toString()} || ' seconds')::interval
    )
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_buckets.reset_at <= now() THEN 1
        ELSE rate_limit_buckets.count + 1
      END,
      reset_at = CASE
        WHEN rate_limit_buckets.reset_at <= now()
          THEN now() + (${windowSeconds.toString()} || ' seconds')::interval
        ELSE rate_limit_buckets.reset_at
      END
    RETURNING count, reset_at
  `);

  // Normalize types: drivers may return string|number|Date depending on adapter
  const row = result.rows[0] as { count: number | string; reset_at: Date | string };
  const count = Number(row.count);
  const resetAt = row.reset_at instanceof Date ? row.reset_at : new Date(row.reset_at);

  // Probabilistic cleanup — 1% of calls clean up expired entries older than 1d.
  // Wrapped: cleanup failure must not affect the rate-limit decision.
  if (Math.random() < 0.01) {
    try {
      await db.execute(
        sql`DELETE FROM rate_limit_buckets WHERE reset_at < now() - interval '1 day'`
      );
    } catch (cleanupErr) {
      logger.warn('[rate-limit] cleanup failed, skipping', { error: cleanupErr });
    }
  }

  return {
    success: count <= config.requests,
    limit: config.requests,
    remaining: Math.max(0, config.requests - count),
    reset: Math.floor(resetAt.getTime() / 1000),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check rate limit for an identifier (usually IP address).
 *
 * Decision tree:
 *   1. RATE_LIMIT_ENABLED=false → bypass (always success)
 *   2. Upstash configured        → Upstash (lowest latency)
 *   3. Postgres + production     → Postgres (multi-instance safe)
 *   4. Otherwise                 → in-memory (single-instance dev)
 *
 * @param identifier  Stable string per actor (typically `getClientIP(req)`)
 * @param type        Bucket name from `LIMITS`
 */
export async function checkRateLimit(
  identifier: string,
  type: keyof typeof LIMITS
): Promise<RateLimitResult> {
  const config = LIMITS[type];

  // Kill-switch — debug, E2E, or emergency bypass
  if (!isRateLimitEnabled()) {
    return {
      success: true,
      limit: config.requests,
      remaining: Number.POSITIVE_INFINITY,
      reset: 0,
    };
  }

  if (isUpstashConfigured()) {
    return upstashRateLimit(identifier, config);
  }

  if (isPostgresAvailable() && process.env.NODE_ENV === 'production') {
    return postgresRateLimit(identifier, config);
  }

  return memoryRateLimit(identifier, config);
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback for local development
  return '127.0.0.1';
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.reset - Math.floor(Date.now() / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    }
  );
}

/**
 * Get current rate limit mode (for debugging/status).
 * Reflects the same decision tree as `checkRateLimit`.
 */
export function getRateLimitMode(): 'disabled' | 'upstash' | 'postgres' | 'memory' {
  if (!isRateLimitEnabled()) return 'disabled';
  if (isUpstashConfigured()) return 'upstash';
  if (isPostgresAvailable() && process.env.NODE_ENV === 'production') return 'postgres';
  return 'memory';
}
