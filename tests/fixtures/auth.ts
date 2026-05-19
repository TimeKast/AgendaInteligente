import { users, passwordResetTokens } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { hashPassword } from '@/lib/auth/utils';
import { hashToken } from '@/lib/auth/password-reset';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Creates a test user in the database.
 * If no password provided, defaults to 'Test1234!'
 *
 * Note: Uses main database - test data is cleaned up after tests.
 */
export async function createTestUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const email = overrides.email || `test-${crypto.randomBytes(4).toString('hex')}@example.com`;
  const password = overrides.password || 'Test1234!';
  const hashedPassword = await hashPassword(password);

  // Generate humanId: use override, or random to avoid sequence/seed collisions in CI
  const humanId =
    overrides.humanId || `USR-T${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const [user] = await db
    .insert(users)
    .values({
      email,
      name: 'Test User',
      password: hashedPassword,
      role: 'user',
      emailVerified: new Date(),
      humanId,
      ...overrides,
    })
    .returning();

  return { ...user, plainPassword: password };
}

/**
 * Creates an ADMIN test user in the database.
 * Convenience wrapper for E2E tests that need admin access.
 */
export async function createAdminTestUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  return createTestUser({ role: 'admin', ...overrides });
}

/**
 * Creates a valid password reset token for a user.
 * Returns the raw token (unhashed) for use in URLs.
 */
export async function createPasswordResetToken(userId: string) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashedToken,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours to avoid timezone issues
  });

  return rawToken;
}

/**
 * Cleans up user and related data (tokens).
 */
export async function cleanupTestUser(userId: string) {
  if (!userId) return;
  try {
    // Cascade usually handles this, but manual cleanup is safer
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    console.error(`Failed to cleanup test user ${userId}:`, error);
  }
}
