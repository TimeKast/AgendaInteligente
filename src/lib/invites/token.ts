/**
 * Invite Token Utilities
 *
 * Low-level functions for token generation and hashing.
 */

import crypto from 'crypto';

/**
 * Generate a secure random invite token.
 * Returns a 64-character hex string (32 bytes).
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash an invite token for secure storage.
 * Uses SHA-256 - same pattern as password reset tokens.
 */
export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Default invite token expiration (7 days in milliseconds).
 */
export const DEFAULT_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
