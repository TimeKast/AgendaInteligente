import { z } from 'zod';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Custom transformers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses boolean from string env var
 * Accepts: "true", "false", "1", "0", "yes", "no" (case-insensitive)
 * Empty string or undefined = undefined (uses default)
 */
const booleanString = z
  .string()
  .optional()
  .transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const lower = val.toLowerCase().trim();
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
    return true; // Default to true for any truthy value
  });

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Environment variable validation schema
 * Validates required and optional environment variables at build/runtime
 */
const envSchema = z.object({
  // ─────────────────────────────────────────────────────────────
  // Database (Required for full functionality)
  // ─────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().optional(),

  // ─────────────────────────────────────────────────────────────
  // Authentication (Required on server, not available on client)
  // ─────────────────────────────────────────────────────────────
  AUTH_SECRET: z.string().optional(), // Validated server-side only
  AUTH_TRUST_HOST: z.string().optional(),

  // NextAuth.js compatibility aliases
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Google OAuth (Optional)
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // Microsoft Graph OAuth (Optional) — only used for Outlook calendar sync,
  // independent from sign-in auth. Required for /api/calendar/microsoft/*.
  MS_CLIENT_ID: z.string().optional(),
  MS_CLIENT_SECRET: z.string().optional(),

  // GitHub OAuth (Optional)
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  // ─────────────────────────────────────────────────────────────
  // Auth Feature Flags (parsed as booleans)
  // ─────────────────────────────────────────────────────────────
  NEXT_PUBLIC_AUTH_PASSWORD: booleanString,
  NEXT_PUBLIC_AUTH_MAGIC_LINK: booleanString,
  NEXT_PUBLIC_AUTH_REGISTRATION: booleanString,
  NEXT_PUBLIC_AUTH_PASSWORD_RESET: booleanString,
  NEXT_PUBLIC_AUTH_EMAIL_VERIFY: booleanString,
  NEXT_PUBLIC_AUTH_GOOGLE: booleanString, // Show Google OAuth button
  NEXT_PUBLIC_AUTH_GITHUB: booleanString, // Show GitHub OAuth button

  // ─────────────────────────────────────────────────────────────
  // Application (Optional with sensible defaults)
  // ─────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_COMPANY_NAME: z.string().optional(),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().email().optional(),
  // Accept both plain email and RFC 5322 format: "Name <email@domain.com>"

  // ─────────────────────────────────────────────────────────────
  // Email Provider (Required for magic link)
  // ─────────────────────────────────────────────────────────────
  EMAIL_PROVIDER: z.enum(['resend', 'smtp', 'none']).optional().default('none'),
  // Accept both plain email and RFC 5322 format: "Name <email@domain.com>"
  EMAIL_FROM: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        // Plain email: user@domain.com
        const plainEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // RFC 5322 format: "Display Name <email@domain.com>" or Display Name <email@domain.com>
        const rfc5322 = /^.+\s*<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
        return plainEmail.test(val) || rfc5322.test(val);
      },
      { message: 'Must be a valid email or "Name <email@domain.com>" format' }
    ),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional().default(587),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_SERVER_SECURE: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default(false),

  // ─────────────────────────────────────────────────────────────
  // Branding (Optional)
  // ─────────────────────────────────────────────────────────────
  NEXT_PUBLIC_LOGO_URL: z.string().url().optional(),

  // ─────────────────────────────────────────────────────────────
  // Notifications (Optional — graceful degradation)
  // ─────────────────────────────────────────────────────────────
  NEXT_PUBLIC_NOTIFICATIONS_ENABLED: booleanString,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // ─────────────────────────────────────────────────────────────
  // AgendaInteligente — AI agent + voice + jobs (REQUIRED in v1)
  // ─────────────────────────────────────────────────────────────
  // Anthropic Claude — agent backbone (proactive check-ins, weekly review)
  ANTHROPIC_API_KEY: z.string().optional(),
  // OpenAI Whisper — STT fallback when Web Speech API unavailable
  OPENAI_API_KEY: z.string().optional(),
  // Inngest — background jobs / scheduled cron
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  // pgcrypto symmetric key for OAuth tokens at-rest (BR-12, BR-20)
  ENCRYPTION_KEY: z.string().optional(),

  // ─────────────────────────────────────────────────────────────
  // Vercel System Variables (auto-injected by Vercel runtime)
  // ─────────────────────────────────────────────────────────────
  VERCEL_URL: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
});

export type EnvSchema = z.infer<typeof envSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Lazy Validation (avoids breaking builds/tests)
// ─────────────────────────────────────────────────────────────────────────────

let _envCache: EnvSchema | null = null;

/**
 * Parse and validate environment variables (lazy, cached)
 * Only validates on first access, not on import
 */
function validateEnv(): EnvSchema {
  if (_envCache) return _envCache;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `  ❌ ${issue.path.join('.')}: ${issue.message}`
    );

    logger.error('\n🚨 Environment Validation Failed:\n');
    logger.error(errors.join('\n'));
    logger.error('\n📝 Check your .env.local file and ensure all required variables are set.\n');

    throw new Error(`Missing or invalid environment variables:\n${errors.join('\n')}`);
  }

  _envCache = result.data;
  return _envCache;
}

// ─────────────────────────────────────────────────────────────────────────────
// Env Accessor (lazy getter)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get validated environment variables (lazy loaded)
 * Use: const config = getEnv();
 */
export function getEnv(): EnvSchema {
  return validateEnv();
}

/**
 * Deprecated: Direct access (kept for backwards compat, but logs warning in dev)
 */
export const env = new Proxy({} as EnvSchema, {
  get(_, prop: string) {
    return validateEnv()[prop as keyof EnvSchema];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Derived Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get NEXTAUTH_SECRET (with fallback to AUTH_SECRET)
 * Only use server-side - throws if not configured
 */
export function getNextAuthSecret(): string {
  const e = getEnv();
  const secret = e.NEXTAUTH_SECRET || e.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is required. Generate with: openssl rand -base64 32');
  }
  return secret;
}

/**
 * Get the canonical application URL (auto-detects Vercel environment)
 *
 * Priority:
 *  1. NEXT_PUBLIC_APP_URL (explicit override, always wins)
 *  2. VERCEL_PROJECT_PRODUCTION_URL (Vercel production domain, auto-injected)
 *  3. VERCEL_URL (Vercel preview/branch deploy, auto-injected)
 *  4. http://localhost:3000 (local development fallback)
 *
 * Vercel system vars come without protocol prefix, so https:// is added.
 */
export function getAppUrl(): string {
  const e = getEnv();
  if (e.NEXT_PUBLIC_APP_URL) return e.NEXT_PUBLIC_APP_URL;
  if (e.VERCEL_PROJECT_PRODUCTION_URL) return `https://${e.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (e.VERCEL_URL) return `https://${e.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/**
 * Get NEXTAUTH_URL (with fallback to getAppUrl())
 */
export function getNextAuthUrl(): string {
  const e = getEnv();
  return e.NEXTAUTH_URL || getAppUrl();
}

/**
 * Get the configured email provider
 */
export function getEmailProvider(): 'resend' | 'smtp' | 'none' {
  const e = getEnv();
  return e.EMAIL_PROVIDER || 'none';
}

/**
 * Check if email provider is properly configured
 */
export function isEmailConfigured(): boolean {
  const e = getEnv();
  const provider = getEmailProvider();

  if (provider === 'none') return false;

  if (provider === 'resend') {
    return !!e.RESEND_API_KEY && !!e.EMAIL_FROM;
  }

  if (provider === 'smtp') {
    return !!e.EMAIL_SERVER_HOST && !!e.EMAIL_FROM;
  }

  return false;
}

/**
 * Get SMTP configuration (throws if not configured)
 */
export function getSmtpConfig() {
  const e = getEnv();
  if (getEmailProvider() !== 'smtp') {
    throw new Error('SMTP not configured. Set EMAIL_PROVIDER="smtp"');
  }
  if (!e.EMAIL_SERVER_HOST || !e.EMAIL_FROM) {
    throw new Error('SMTP requires EMAIL_SERVER_HOST and EMAIL_FROM');
  }
  return {
    host: e.EMAIL_SERVER_HOST,
    port: e.EMAIL_SERVER_PORT ?? 587,
    secure: e.EMAIL_SERVER_SECURE ?? false,
    auth: e.EMAIL_SERVER_USER
      ? {
          user: e.EMAIL_SERVER_USER,
          pass: e.EMAIL_SERVER_PASSWORD || '',
        }
      : undefined,
    from: e.EMAIL_FROM,
  };
}

/**
 * Get Resend configuration (throws if not configured)
 */
export function getResendConfig() {
  const e = getEnv();
  if (getEmailProvider() !== 'resend') {
    throw new Error('Resend not configured. Set EMAIL_PROVIDER="resend"');
  }
  if (!e.RESEND_API_KEY || !e.EMAIL_FROM) {
    throw new Error('Resend requires RESEND_API_KEY and EMAIL_FROM');
  }
  return {
    apiKey: e.RESEND_API_KEY,
    from: e.EMAIL_FROM,
  };
}

/**
 * Check if Google OAuth is properly configured
 */
export function isGoogleOAuthConfigured(): boolean {
  const e = getEnv();
  return !!e.AUTH_GOOGLE_ID && !!e.AUTH_GOOGLE_SECRET;
}

/**
 * Check if GitHub OAuth is properly configured
 */
export function isGitHubOAuthConfigured(): boolean {
  const e = getEnv();
  return !!e.AUTH_GITHUB_ID && !!e.AUTH_GITHUB_SECRET;
}

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  const e = getEnv();
  return !!e.DATABASE_URL;
}

/**
 * Check if notifications feature is enabled
 */
export function isNotificationsEnabled(): boolean {
  const parseBool = (val: string | undefined, defaultVal: boolean): boolean => {
    if (val === undefined || val === '') return defaultVal;
    return val.toLowerCase() !== 'false' && val !== '0';
  };
  return parseBool(process.env.NEXT_PUBLIC_NOTIFICATIONS_ENABLED, false);
}

/**
 * Check if Web Push (VAPID) is properly configured
 */
export function isPushConfigured(): boolean {
  const e = getEnv();
  return !!e.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!e.VAPID_PRIVATE_KEY && !!e.VAPID_SUBJECT;
}

/**
 * Get VAPID configuration (throws if not configured)
 */
export function getVapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} {
  const e = getEnv();
  if (!isPushConfigured()) {
    throw new Error(
      'VAPID not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.\n' +
        'Generate keys with: npx web-push generate-vapid-keys'
    );
  }
  return {
    publicKey: e.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    privateKey: e.VAPID_PRIVATE_KEY!,
    subject: e.VAPID_SUBJECT!,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Feature Flags (with smart defaults)
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthFeatureFlags {
  password: boolean;
  magicLink: boolean;
  registration: boolean;
  passwordReset: boolean;
  emailVerify: boolean;
  google: boolean;
  github: boolean;
}

/**
 * Get resolved auth feature flags with smart validation
 * Uses raw process.env for NEXT_PUBLIC_* to ensure consistent SSR/client values
 */
export function getAuthFeatures(): AuthFeatureFlags {
  // Helper to parse boolean from env (consistent on server and client)
  const parseBool = (val: string | undefined, defaultVal: boolean): boolean => {
    if (val === undefined || val === '') return defaultVal;
    return val.toLowerCase() !== 'false' && val !== '0';
  };

  // Read directly from process.env to avoid SSR/client mismatch
  let password = parseBool(process.env.NEXT_PUBLIC_AUTH_PASSWORD, true);
  const magicLinkRequested = parseBool(process.env.NEXT_PUBLIC_AUTH_MAGIC_LINK, false);
  let registration = parseBool(process.env.NEXT_PUBLIC_AUTH_REGISTRATION, true);
  const passwordReset = parseBool(process.env.NEXT_PUBLIC_AUTH_PASSWORD_RESET, true);
  const emailVerify = parseBool(process.env.NEXT_PUBLIC_AUTH_EMAIL_VERIFY, false);

  // OAuth from public feature flags (client-safe)
  const google = parseBool(process.env.NEXT_PUBLIC_AUTH_GOOGLE, false);
  const github = parseBool(process.env.NEXT_PUBLIC_AUTH_GITHUB, false);

  // Magic link validation (only check email config on server where it's available)
  let magicLink = magicLinkRequested;
  if (magicLinkRequested && typeof window === 'undefined') {
    // Server-side: validate email provider is configured
    if (!isEmailConfigured()) {
      logger.warn('Magic link enabled but no email provider configured. Disabled.');
      magicLink = false;
    }
  }

  // Fallback: if no auth methods available, enable password + registration
  const hasAnyMethod = password || magicLink || google || github;
  if (!hasAnyMethod && typeof window === 'undefined') {
    logger.warn('No auth methods available. Enabling password + registration as fallback.');
    password = true;
    registration = true;
  }

  return {
    password,
    magicLink,
    registration,
    passwordReset,
    emailVerify,
    google,
    github,
  };
}

/**
 * Validate that at least one auth method is available
 * Call this at app startup to fail fast
 */
export function validateAuthMethods(): void {
  const flags = getAuthFeatures();

  if (!flags.password && !flags.magicLink && !flags.google && !flags.github) {
    throw new Error(
      '🚨 No authentication methods available!\n' +
        'Configure at least one of:\n' +
        '  - NEXT_PUBLIC_AUTH_PASSWORD="true"\n' +
        '  - NEXT_PUBLIC_AUTH_MAGIC_LINK="true" + email provider\n' +
        '  - AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET\n' +
        '  - AUTH_GITHUB_ID + AUTH_GITHUB_SECRET'
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AgendaInteligente — service accessors
// ─────────────────────────────────────────────────────────────────────────────

export function getAnthropicKey(): string {
  const e = getEnv();
  if (!e.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required. Get one at https://console.anthropic.com');
  }
  return e.ANTHROPIC_API_KEY;
}

export function isOpenAIConfigured(): boolean {
  return !!getEnv().OPENAI_API_KEY;
}

export function getOpenAIKey(): string {
  const e = getEnv();
  if (!e.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for Whisper fallback.');
  }
  return e.OPENAI_API_KEY;
}

export function isInngestConfigured(): boolean {
  const e = getEnv();
  return !!e.INNGEST_EVENT_KEY && !!e.INNGEST_SIGNING_KEY;
}

export function getInngestConfig(): { eventKey: string; signingKey: string } {
  const e = getEnv();
  if (!e.INNGEST_EVENT_KEY || !e.INNGEST_SIGNING_KEY) {
    throw new Error(
      'Inngest not configured. Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY (see https://app.inngest.com).'
    );
  }
  return { eventKey: e.INNGEST_EVENT_KEY, signingKey: e.INNGEST_SIGNING_KEY };
}

/**
 * Get the pgcrypto symmetric key for encrypting OAuth tokens at-rest (BR-12, BR-20).
 * Required to use any feature that stores sensitive tokens (Calendar connections).
 */
export function getEncryptionKey(): string {
  const e = getEnv();
  if (!e.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is required. Generate with: openssl rand -base64 32');
  }
  return e.ENCRYPTION_KEY;
}

export function isMicrosoftCalendarConfigured(): boolean {
  const e = getEnv();
  return !!e.MS_CLIENT_ID && !!e.MS_CLIENT_SECRET;
}

export function getMicrosoftCredentials(): { clientId: string; clientSecret: string } {
  const e = getEnv();
  if (!e.MS_CLIENT_ID || !e.MS_CLIENT_SECRET) {
    throw new Error(
      'Microsoft calendar OAuth not configured: missing MS_CLIENT_ID or MS_CLIENT_SECRET'
    );
  }
  return { clientId: e.MS_CLIENT_ID, clientSecret: e.MS_CLIENT_SECRET };
}
