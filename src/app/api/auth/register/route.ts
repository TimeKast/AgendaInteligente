/**
 * Self-Registration API Route
 *
 * POST /api/auth/register
 *
 * Public endpoint that creates a user account. Behavior:
 *
 * - Gated by `authFeatures.features.registration && providers.credentials`
 *   (returns 403 `RegistrationDisabled` if either is off).
 * - Rate-limited by IP via the `register` bucket (KIT-020).
 * - **Secure-by-default 200 response**: when the email already exists, the
 *   server returns the same `{ success: true }` shape as a real creation,
 *   so the endpoint never leaks user-enumeration information. The client
 *   then attempts `signIn('credentials')` — which fails for the attacker
 *   (wrong password) and succeeds for the legitimate user (UX trade-off
 *   documented in the issue).
 * - Retries 23505 unique-constraint conflicts with the same pattern as
 *   `lib/actions/admin/user-admin.ts`: collisions on `users_human_id_unique`
 *   trigger a fresh `getNextHumanId`; collisions on `users_email_unique`
 *   are treated as a race against the SELECT and converted to the same
 *   200 generic response.
 *
 * @see KIT-022
 */

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/utils';
import { isWeakPassword } from '@/lib/auth/weak-passwords';
import { sendVerificationEmail } from '@/lib/auth/email-verification';
import { authFeatures } from '@/config/auth-features';
import { getDefaultRole } from '@/config/roles';
import { getNextHumanId, HUMAN_ID_PREFIXES } from '@/lib/utils/human-id';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitExceededResponse } from '@/lib/rate-limit';
import { isDatabaseConfigured } from '@/lib/env';

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .refine((p) => !isWeakPassword(p), {
      message: 'Elige una contraseña más fuerte',
    }),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

const MAX_HUMAN_ID_RETRIES = 5;

const SUCCESS_RESPONSE = { success: true } as const;

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Feature gate (registration + credentials provider both enabled)
  if (!authFeatures.features.registration || !authFeatures.providers.credentials) {
    return NextResponse.json(
      { error: 'RegistrationDisabled', message: 'El registro está deshabilitado.' },
      { status: 403 }
    );
  }

  // 2. Rate limit per IP — register bucket is intentionally tight (3/h default)
  const ip = getClientIP(req);
  const rateLimit = await checkRateLimit(ip, 'register');
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit);

  // 3. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ValidationFailed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!isDatabaseConfigured()) {
    logger.error('[/api/auth/register] DATABASE_URL not configured');
    return NextResponse.json(
      { error: 'ServiceUnavailable', message: 'Servicio no disponible.' },
      { status: 503 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const { password, name } = parsed.data;

  // 4. Best-effort enumeration check: if the email already exists, return the
  //    generic 200 response. We log internally for ops visibility but never
  //    differentiate the response shape. signIn() on the client will fail
  //    naturally for unknown passwords.
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    logger.info('[/api/auth/register] register attempt for existing email', { email, ip });
    return NextResponse.json(SUCCESS_RESPONSE);
  }

  // 5. Hash and insert with retry loop on humanId / email unique conflicts.
  const hashedPassword = await hashPassword(password);
  const role = getDefaultRole();

  for (let attempt = 0; attempt < MAX_HUMAN_ID_RETRIES; attempt++) {
    const humanId = await getNextHumanId(db, 'user_human_id_seq', {
      prefix: HUMAN_ID_PREFIXES.USER,
      includeYear: false,
    });

    try {
      const [inserted] = await db
        .insert(users)
        .values({
          humanId,
          name: name.trim(),
          email,
          role,
          password: hashedPassword,
        })
        .returning({ id: users.id });

      logger.info('[/api/auth/register] user registered', {
        userId: inserted?.id,
        ip,
      });

      // Send verification email best-effort. We never fail the signup just
      // because the mail provider (or token table writes) hiccupped — the
      // user can request a resend later. When EMAIL_PROVIDER is unconfigured
      // the helper short-circuits and logs the verify URL (dev DX).
      if (inserted?.id) {
        try {
          const send = await sendVerificationEmail(inserted.id, email);
          if (!send.ok) {
            logger.warn('[/api/auth/register] verification email not sent', {
              userId: inserted.id,
              reason: send.reason,
            });
          }
        } catch (verifyErr) {
          logger.warn('[/api/auth/register] verification dispatch threw', {
            userId: inserted.id,
            error: verifyErr,
          });
        }
      }

      return NextResponse.json(SUCCESS_RESPONSE);
    } catch (err: unknown) {
      // Drizzle wraps PG errors — check both top-level and cause
      const pgErr = err as {
        cause?: { code?: string; constraint?: string };
        code?: string;
        constraint?: string;
      };
      const code = pgErr.code || pgErr.cause?.code;
      const constraint = pgErr.constraint || pgErr.cause?.constraint;

      if (code === '23505') {
        if (constraint === 'users_human_id_unique') {
          // Sequence collision — try again with the next nextval
          continue;
        }
        if (constraint === 'users_email_unique') {
          // Race against the SELECT in step 4 — return the generic 200
          // (do not throw, do not leak the existence)
          logger.info('[/api/auth/register] race on users_email_unique', { email, ip });
          return NextResponse.json(SUCCESS_RESPONSE);
        }
      }

      logger.error('[/api/auth/register] insert failed', { error: err, ip });
      return NextResponse.json(
        { error: 'InternalError', message: 'Ocurrió un error al crear la cuenta.' },
        { status: 500 }
      );
    }
  }

  // Exhausted retries — sequence is severely out of sync
  logger.error('[/api/auth/register] humanId retries exhausted', { ip });
  return NextResponse.json(
    {
      error: 'InternalError',
      message: 'No se pudo generar un ID único. Intenta de nuevo más tarde.',
    },
    { status: 500 }
  );
}
