/**
 * Auth Utilities (Architecture-agnostic)
 *
 * Contains pure functions for authentication that don't depend on NextAuth/Framewok.
 * Safe to import in tests and scripts.
 */

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  // Dynamic import to avoid issues in edge runtime
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}
