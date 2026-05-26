/**
 * Email verification flow (ISSUE-004).
 *
 * Mirrors the password-reset pattern:
 *   - Token: 32 bytes random → base64url string, sha-256 hashed before
 *     storage. Plain value only exists in transit (email body / URL).
 *   - 24h expiry.
 *   - One token per user — minting a new one invalidates the old.
 *
 * Public API:
 *   - `generateVerificationToken()`  → { token, hash }
 *   - `sendVerificationEmail(userId, email)`  → success | error string
 *   - `verifyEmailToken(token)`  → { ok: true, userId } | { ok: false, reason }
 *
 * Linked: FT-002, US-003.
 */

import { createHash, randomBytes } from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { emailVerificationTokens } from '@/lib/db/schema/email-verifications';
import { getAppUrl, isEmailConfigured, isDatabaseConfigured } from '@/lib/env';
import { sendEmail } from '@/lib/email';
import { verifyEmail, verifyEmailText } from '@/lib/email/templates/verify-email';

const TOKEN_TTL_HOURS = 24;

/** Generate a fresh random token + its sha-256 hex hash. */
export function generateVerificationToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Mint a token, persist its hash, and email the user a verification link.
 * Idempotent on re-call — replaces any prior unused token for the same user.
 *
 * Returns `{ ok: true }` on send (or graceful skip when email is unconfigured),
 * and `{ ok: false, reason }` for hard failures the caller should surface.
 */
export async function sendVerificationEmail(
  userId: string,
  email: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: 'database_not_configured' };
  }

  const { token, hash } = generateVerificationToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  // Invalidate prior tokens for this user first — keep the row count bounded.
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));

  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: hash,
    expiresAt,
  });

  // If email provider isn't configured (dev w/o Resend), short-circuit with
  // a logger.info so devs can grab the URL from logs. Production deploys
  // MUST configure EMAIL_PROVIDER — see the kit env docs.
  const verifyUrl = `${getAppUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;

  if (!isEmailConfigured()) {
    logger.info(`[email-verification] would send verification to ${email}: ${verifyUrl}`);
    return { ok: true };
  }

  const result = await sendEmail({
    to: email,
    subject: 'Confirma tu email — AgendaInteligente',
    html: verifyEmail({ url: verifyUrl }),
    text: verifyEmailText({ url: verifyUrl }),
  });

  if (!result.success) {
    logger.error('[email-verification] sendEmail failed', { error: result.error, email });
    return { ok: false, reason: 'email_send_failed' };
  }

  return { ok: true };
}

/**
 * Validate a token from a verification link and mark the user's email as
 * verified. Idempotent — re-clicking the link after a successful verify
 * returns `invalid` (the token has already been consumed/deleted).
 *
 * Returns explicit reasons so the route handler can map to friendly UI
 * states (invalid token vs expired vs already-used).
 */
export async function verifyEmailToken(
  token: string
): Promise<{ ok: true; userId: string } | { ok: false; reason: 'invalid' | 'expired' }> {
  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'invalid' };
  }

  const hash = createHash('sha256').update(token).digest('hex');

  const rows = await db
    .select({
      userId: emailVerificationTokens.userId,
      expiresAt: emailVerificationTokens.expiresAt,
      tokenHash: emailVerificationTokens.tokenHash,
    })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, hash),
        gt(emailVerificationTokens.expiresAt, new Date())
      )
    );

  if (rows.length === 0) {
    // Could be expired, never existed, or already consumed. We don't
    // distinguish to avoid a tiny enumeration vector (attacker knows
    // a token existed if we differentiate expired vs invalid).
    return { ok: false, reason: 'invalid' };
  }

  const { userId } = rows[0];

  // Set users.email_verified + consume the token in one go. The kit's
  // `users` column is named `email_verified` (timestamp), set to now().
  await db.transaction(async (tx) => {
    await tx.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId));
    await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, hash));
  });

  return { ok: true, userId };
}
