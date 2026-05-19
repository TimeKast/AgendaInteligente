/**
 * Invite System - Main Entry Point
 *
 * Provides functions for creating, validating, and managing invite tokens.
 *
 * @example
 * import { createInviteToken, validateInviteToken } from '@/lib/invites';
 *
 * // Create invite
 * const { token, invite } = await createInviteToken('user@example.com', inviterId);
 *
 * // Send token to user...
 *
 * // Later, validate
 * const valid = await validateInviteToken(token);
 */

import { db } from '@/lib/db/drizzle';
import { inviteTokens, type InviteToken } from '@/lib/db/schema/invites';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { generateInviteToken, hashInviteToken, DEFAULT_INVITE_EXPIRY_MS } from './token';

// Re-export types and utilities
export type { InviteToken } from '@/lib/db/schema/invites';
export { generateInviteToken, hashInviteToken, DEFAULT_INVITE_EXPIRY_MS } from './token';

// =============================================================================
// Types
// =============================================================================

export interface CreateInviteOptions {
  /** Expiration in milliseconds (default: 7 days) */
  expiresInMs?: number;
  /** Optional metadata to store with invite */
  metadata?: Record<string, unknown>;
}

export interface CreateInviteResult {
  /** The raw token to send to the user (NOT stored in DB) */
  token: string;
  /** The invite record (with hashed token) */
  invite: InviteToken;
}

export interface ValidateInviteResult {
  /** Whether the invite is valid */
  valid: boolean;
  /** The invite if valid, null otherwise */
  invite: InviteToken | null;
  /** Error message if invalid */
  error?: string;
}

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Create a new invite token for an email address.
 *
 * @param email - Email address to invite
 * @param invitedBy - ID of user sending the invite (optional)
 * @param options - Additional options
 * @returns The raw token and invite record
 */
export async function createInviteToken(
  email: string,
  invitedBy?: string,
  options: CreateInviteOptions = {}
): Promise<CreateInviteResult> {
  const { expiresInMs = DEFAULT_INVITE_EXPIRY_MS, metadata } = options;

  // Generate token
  const rawToken = generateInviteToken();
  const hashedToken = hashInviteToken(rawToken);

  // Calculate expiration
  const expiresAt = new Date(Date.now() + expiresInMs);

  // Delete any existing invites for this email (one active invite per email)
  await db.delete(inviteTokens).where(eq(inviteTokens.email, email.toLowerCase()));

  // Insert new invite
  const [invite] = await db
    .insert(inviteTokens)
    .values({
      email: email.toLowerCase(),
      token: hashedToken,
      invitedBy: invitedBy || null,
      expiresAt,
      metadata: metadata || null,
    })
    .returning();

  return {
    token: rawToken,
    invite,
  };
}

/**
 * Validate an invite token.
 *
 * Checks that the token:
 * 1. Exists in the database
 * 2. Has not expired
 * 3. Has not been used (acceptedAt is null)
 *
 * @param token - The raw token to validate
 * @returns Validation result with invite if valid
 */
export async function validateInviteToken(token: string): Promise<ValidateInviteResult> {
  const hashedToken = hashInviteToken(token);

  // Find valid invite
  const [invite] = await db
    .select()
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.token, hashedToken),
        isNull(inviteTokens.acceptedAt),
        gt(inviteTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invite) {
    // Check if token exists at all (for better error messages)
    const [existingInvite] = await db
      .select()
      .from(inviteTokens)
      .where(eq(inviteTokens.token, hashedToken))
      .limit(1);

    if (!existingInvite) {
      return { valid: false, invite: null, error: 'Invalid invite token' };
    }

    if (existingInvite.acceptedAt) {
      return { valid: false, invite: null, error: 'Invite already used' };
    }

    if (existingInvite.expiresAt < new Date()) {
      return { valid: false, invite: null, error: 'Invite has expired' };
    }

    return { valid: false, invite: null, error: 'Invalid invite token' };
  }

  return { valid: true, invite };
}

/**
 * Mark an invite token as accepted.
 *
 * @param token - The raw token to mark as accepted
 * @returns The updated invite record, or null if not found
 */
export async function markInviteAsAccepted(token: string): Promise<InviteToken | null> {
  const hashedToken = hashInviteToken(token);

  const [updated] = await db
    .update(inviteTokens)
    .set({ acceptedAt: new Date() })
    .where(and(eq(inviteTokens.token, hashedToken), isNull(inviteTokens.acceptedAt)))
    .returning();

  return updated || null;
}

/**
 * Get an invite by email address.
 * Useful for checking if an email already has a pending invite.
 *
 * @param email - Email address to check
 * @returns The invite if found, null otherwise
 */
export async function getInviteByEmail(email: string): Promise<InviteToken | null> {
  const [invite] = await db
    .select()
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.email, email.toLowerCase()),
        isNull(inviteTokens.acceptedAt),
        gt(inviteTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  return invite || null;
}
