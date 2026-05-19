#!/usr/bin/env tsx
/**
 * Environment Variables Validator
 *
 * Validates required and optional environment variables against the Zod schema
 * declared in `src/lib/env.ts`. Exits with code 0 on success, !=0 on failure.
 *
 * Usage:
 *   pnpm env:check
 *
 * On failure, the error message lists the missing/invalid keys (Zod error
 * format from `getEnv()`).
 *
 * @see KIT-021 §A
 */

import { config } from 'dotenv';

// Load `.env.local` first (next.js convention) before importing env.ts so that
// `getEnv()`'s Zod schema sees the same vars Next.js sees at runtime.
config({ path: '.env.local' });

async function main(): Promise<void> {
  // Lazy import — env.ts runs the Zod parse on first `getEnv()` call.
  const { getEnv, getNextAuthSecret, validateAuthMethods } = await import('../../src/lib/env');

  try {
    // 1. Zod schema parse (catches type/format errors on declared vars)
    getEnv();

    // 2. Strict checks for vars that the schema marks optional but are
    //    runtime-critical. These mirror what `auth.ts` requires server-side.
    getNextAuthSecret(); // throws if AUTH_SECRET / NEXTAUTH_SECRET missing
    validateAuthMethods(); // throws if no auth method available

    console.log('✅ Environment OK — all required variables present and valid.');
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Environment validation failed:\n');
    console.error(msg);
    process.exit(1);
  }
}

void main();
