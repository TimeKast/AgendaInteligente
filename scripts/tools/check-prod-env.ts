#!/usr/bin/env tsx
/**
 * Production env-vars validator (AgendaInteligente v1).
 *
 * Companion to `env:check` (kit-level Zod parse). This script encodes the
 * AgendaInteligente-specific feature stack: what must be set for the
 * production app to actually function vs what causes a feature to be
 * silently disabled (graceful degradation).
 *
 * Exit codes:
 *   0 — all blockers present (warnings may still exist).
 *   1 — at least one BLOCKER var is missing or empty.
 *
 * Usage:
 *   pnpm check:prod-env        # dry-run against current env (.env.local)
 *   NODE_ENV=production pnpm check:prod-env
 *
 * Vercel integration: add to `build` script as `pnpm check:prod-env && next build`
 * or wire as `prebuild` hook. Vercel exposes prod env vars at build time so the
 * check runs against the real set; if a blocker is missing the build fails fast
 * with a clear pointer instead of a 500 at runtime.
 */

import { config } from 'dotenv';
import { existsSync } from 'node:fs';

// Only load .env.local for local dry-runs. In Vercel, env vars are already
// injected before this script runs, so the file won't exist and we skip silently.
if (existsSync('.env.local')) {
  config({ path: '.env.local' });
}

type Severity = 'blocker' | 'warning';

interface VarSpec {
  name: string;
  severity: Severity;
  /** One-line description of what this enables. */
  feature: string;
  /** Where to obtain the value. */
  source: string;
  /**
   * Optional dependency — only check this var if the named one is also set.
   * Use for paired keys (e.g. VAPID_PRIVATE_KEY only matters if the public
   * key is also set).
   */
  dependsOn?: string;
  /** Optional value-shape validator (returns null on OK, error string on fail). */
  validate?: (value: string) => string | null;
}

// ── Validators ────────────────────────────────────────────────────────

const isBase64_32 = (v: string): string | null => {
  try {
    const buf = Buffer.from(v, 'base64');
    return buf.length === 32 ? null : `expected 32 bytes after base64-decode, got ${buf.length}`;
  } catch {
    return 'not valid base64';
  }
};

const isUrl = (v: string): string | null => {
  try {
    new URL(v);
    return null;
  } catch {
    return 'not a valid URL';
  }
};

const isHttpsInProd = (v: string): string | null => {
  if (process.env.NODE_ENV !== 'production') return null;
  return v.startsWith('https://') ? null : 'must use https:// in production';
};

const isPostgresUrl = (v: string): string | null => {
  if (!v.startsWith('postgres://') && !v.startsWith('postgresql://')) {
    return 'expected postgres:// or postgresql:// URL';
  }
  return null;
};

// ── The spec ─────────────────────────────────────────────────────────

const SPEC: VarSpec[] = [
  // ── BLOCKERS — app cannot function without these ──────────────────
  {
    name: 'DATABASE_URL',
    severity: 'blocker',
    feature: 'Postgres (every table, every action, every read)',
    source: 'Neon → console.neon.tech → project → Connection Details',
    validate: isPostgresUrl,
  },
  {
    name: 'AUTH_SECRET',
    severity: 'blocker',
    feature: 'NextAuth session signing + OAuth state CSRF (calendar)',
    source: 'openssl rand -base64 32 (must be base64-decoded 32 bytes)',
    validate: isBase64_32,
  },
  {
    name: 'ENCRYPTION_KEY',
    severity: 'blocker',
    feature: 'AES-256-GCM for Calendar OAuth tokens at rest (BR-12 / BR-20)',
    source: 'openssl rand -base64 32 — DO NOT regenerate (stable for token lifetime)',
    validate: isBase64_32,
  },
  {
    name: 'ANTHROPIC_API_KEY',
    severity: 'blocker',
    feature: 'Claude Sonnet/Haiku — chat agent + voice parser',
    source: 'console.anthropic.com → API Keys',
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    severity: 'blocker',
    feature: 'OAuth redirect_uri + crisis-line links + SSE absolute URLs',
    source: 'your Vercel deployment URL (e.g. https://agenda-inteligente.vercel.app)',
    validate: (v) => isUrl(v) ?? isHttpsInProd(v),
  },

  // ── BLOCKERS — auth providers ─────────────────────────────────────
  {
    name: 'AUTH_GOOGLE_ID',
    severity: 'blocker',
    feature: 'Google login + Calendar OAuth (both flows share this client)',
    source: 'console.cloud.google.com/apis/credentials',
  },
  {
    name: 'AUTH_GOOGLE_SECRET',
    severity: 'blocker',
    feature: 'Google login + Calendar OAuth',
    source: 'console.cloud.google.com/apis/credentials',
  },

  // ── BLOCKERS — background jobs ────────────────────────────────────
  {
    name: 'INNGEST_EVENT_KEY',
    severity: 'blocker',
    feature: '17 cron functions (check-ins, recurrence, sheet materializers, calendar sync, etc.)',
    source: 'app.inngest.com → app "agenda-inteligente" → Event Keys',
  },
  {
    name: 'INNGEST_SIGNING_KEY',
    severity: 'blocker',
    feature: 'Inngest webhook signature verification on /api/inngest',
    source: 'app.inngest.com → app "agenda-inteligente" → Signing Keys',
  },

  // ── WARNINGS — features degrade gracefully if missing ─────────────
  {
    name: 'OPENAI_API_KEY',
    severity: 'warning',
    feature: 'Whisper STT fallback (Firefox / older Safari users)',
    source: 'platform.openai.com/api-keys',
  },
  {
    name: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    severity: 'warning',
    feature: 'Web Push notifications (silently disabled if missing)',
    source: 'npx web-push generate-vapid-keys --json',
  },
  {
    name: 'VAPID_PRIVATE_KEY',
    severity: 'warning',
    feature: 'Web Push private signer',
    source: 'pair generated alongside NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    dependsOn: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  },
  {
    name: 'VAPID_SUBJECT',
    severity: 'warning',
    feature: 'Web Push subject (RFC 8030 — mailto: or https://)',
    source: 'free choice — mailto:admin@yourdomain or https://yourdomain',
    dependsOn: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  },
  {
    name: 'NEXTAUTH_URL',
    severity: 'warning',
    feature: 'Explicit NextAuth callback host — strongly recommended in production',
    source: 'same as NEXT_PUBLIC_APP_URL',
    validate: (v) => isUrl(v) ?? isHttpsInProd(v),
  },
  {
    name: 'UPSTASH_REDIS_REST_URL',
    severity: 'warning',
    feature: 'Multi-instance rate limiting (falls back to Postgres if missing)',
    source: 'vercel.com/integrations/upstash',
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    severity: 'warning',
    feature: 'Error tracking (errors only logged to stdout if missing)',
    source: 'sentry.io → project → Settings → Client Keys (DSN)',
  },
];

// ── Runner ───────────────────────────────────────────────────────────

interface Result {
  spec: VarSpec;
  state: 'ok' | 'missing' | 'invalid' | 'skipped';
  detail?: string;
}

function checkOne(spec: VarSpec): Result {
  if (spec.dependsOn) {
    const dep = process.env[spec.dependsOn];
    if (!dep || dep.trim() === '') {
      return { spec, state: 'skipped' };
    }
  }
  const value = process.env[spec.name];
  if (!value || value.trim() === '') {
    return { spec, state: 'missing' };
  }
  if (spec.validate) {
    const err = spec.validate(value);
    if (err) return { spec, state: 'invalid', detail: err };
  }
  return { spec, state: 'ok' };
}

function format(results: Result[]): { exit: number; output: string } {
  const lines: string[] = [];
  const counts = { ok: 0, missingBlocker: 0, missingWarning: 0, invalid: 0, skipped: 0 };

  for (const r of results) {
    if (r.state === 'ok') counts.ok++;
    else if (r.state === 'skipped') counts.skipped++;
    else if (r.state === 'invalid') counts.invalid++;
    else if (r.spec.severity === 'blocker') counts.missingBlocker++;
    else counts.missingWarning++;
  }

  lines.push('');
  lines.push('Production env audit — AgendaInteligente v1');
  lines.push('='.repeat(60));

  // Blockers first.
  const blockers = results.filter((r) => r.spec.severity === 'blocker');
  lines.push('\n🔴 BLOCKERS — required for the app to function:');
  for (const r of blockers) {
    if (r.state === 'ok') {
      lines.push(`  ✅ ${r.spec.name}`);
    } else if (r.state === 'invalid') {
      lines.push(`  ❌ ${r.spec.name} — INVALID: ${r.detail}`);
      lines.push(`       ${r.spec.feature}`);
      lines.push(`       Source: ${r.spec.source}`);
    } else if (r.state === 'missing') {
      lines.push(`  ❌ ${r.spec.name} — MISSING`);
      lines.push(`       Enables: ${r.spec.feature}`);
      lines.push(`       Source:  ${r.spec.source}`);
    }
  }

  // Warnings.
  const warnings = results.filter((r) => r.spec.severity === 'warning');
  lines.push('\n🟡 WARNINGS — graceful degradation if missing:');
  for (const r of warnings) {
    if (r.state === 'ok') {
      lines.push(`  ✅ ${r.spec.name}`);
    } else if (r.state === 'skipped') {
      lines.push(`  ⏭  ${r.spec.name} — skipped (dependsOn ${r.spec.dependsOn} unset)`);
    } else if (r.state === 'invalid') {
      lines.push(`  ⚠️  ${r.spec.name} — INVALID: ${r.detail}`);
    } else {
      lines.push(`  ⚠️  ${r.spec.name} — disables: ${r.spec.feature}`);
    }
  }

  // Summary.
  lines.push('\n' + '='.repeat(60));
  const blockerFail =
    counts.missingBlocker +
    results.filter((r) => r.state === 'invalid' && r.spec.severity === 'blocker').length;
  if (blockerFail > 0) {
    lines.push(`❌ ${blockerFail} BLOCKER(s) failing — deploy will misbehave at runtime.`);
  } else {
    lines.push('✅ All blockers present.');
  }
  if (counts.missingWarning > 0) {
    lines.push(`⚠️  ${counts.missingWarning} feature(s) running degraded.`);
  }
  lines.push('');

  return {
    exit: blockerFail > 0 ? 1 : 0,
    output: lines.join('\n'),
  };
}

function main(): void {
  const results = SPEC.map(checkOne);
  const { exit, output } = format(results);
  console.log(output);
  process.exit(exit);
}

main();
