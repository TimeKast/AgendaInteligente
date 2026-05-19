/**
 * Password Reset Utilities
 *
 * Handles token generation, validation, and password reset flow.
 *
 * Security:
 * - Tokens are hashed (SHA-256) before storage
 * - One token per user (new request invalidates old)
 * - Tokens expire after 1 hour
 * - No user enumeration (always return success)
 */

import { logger } from '@/lib/logger';

import { createHash, randomBytes } from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { getEnv, getAppUrl, isEmailConfigured, isDatabaseConfigured } from '@/lib/env';
import { sendEmail, passwordResetEmail, passwordResetEmailText } from '@/lib/email';
import { hashPassword } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
// Token Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a secure random token and its hash
 */
export function generateResetToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Hash a token for comparison
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Password Reset Flow
// ─────────────────────────────────────────────────────────────────────────────

export interface RequestResetResult {
  success: boolean;
  error?: string;
}

/**
 * Request a password reset for an email.
 *
 * Security: Always returns success to prevent user enumeration.
 * Only sends email if user exists and email is configured.
 */
export async function requestPasswordReset(email: string): Promise<RequestResetResult> {
  // Check prerequisites
  if (!isDatabaseConfigured()) {
    logger.error('[Password Reset] Database not configured');
    return { success: true }; // Don't reveal config issues
  }

  if (!isEmailConfigured()) {
    logger.error('[Password Reset] Email not configured');
    return { success: true }; // Don't reveal config issues
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    // If user doesn't exist, return success anyway (prevent enumeration)
    if (!user) {
      logger.info('[Password Reset] User not found, returning success anyway');
      return { success: true };
    }

    // Delete any existing tokens for this user (one token per user)
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    // Generate new token
    const { token, hash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token hash (NOT the plain token)
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    });

    // Build reset URL
    const appUrl = getAppUrl();
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Send email
    const result = await sendEmail({
      to: normalizedEmail,
      subject: `Restablecer contraseña - ${getEnv().NEXT_PUBLIC_APP_NAME || 'App'}`,
      html: passwordResetEmail({ url: resetUrl, userName: user.name || undefined }),
      text: passwordResetEmailText({ url: resetUrl, userName: user.name || undefined }),
    });

    if (!result.success) {
      logger.error('[Password Reset] Failed to send email:', result.error);
      // Still return success to prevent enumeration
    }

    return { success: true };
  } catch (error) {
    logger.error('[Password Reset] Error:', error);
    return { success: true }; // Always return success
  }
}

export interface ValidateTokenResult {
  valid: boolean;
  userId?: string;
  error?: string;
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(token: string): Promise<ValidateTokenResult> {
  if (!token) {
    return { valid: false, error: 'Token is required' };
  }

  if (!isDatabaseConfigured()) {
    return { valid: false, error: 'Service unavailable' };
  }

  try {
    const tokenHash = hashToken(token);
    const now = new Date();

    // Find valid token
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, now)
      ),
    });

    if (!resetToken) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    return { valid: true, userId: resetToken.userId };
  } catch (error) {
    logger.error('[Password Reset] Token validation error:', error);
    return { valid: false, error: 'Validation failed' };
  }
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

/**
 * Reset password using a valid token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  // Validate token first
  const validation = await validateResetToken(token);

  if (!validation.valid || !validation.userId) {
    return { success: false, error: validation.error || 'Invalid token' };
  }

  try {
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        modifiedAt: new Date(),
      })
      .where(eq(users.id, validation.userId));

    // Delete used token
    const tokenHash = hashToken(token);
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));

    return { success: true };
  } catch (error) {
    logger.error('[Password Reset] Reset error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}
