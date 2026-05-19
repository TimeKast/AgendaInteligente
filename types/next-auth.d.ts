import { type DefaultSession } from 'next-auth';

/**
 * NextAuth.js Type Extensions
 *
 * Extend the default NextAuth types to include our custom fields.
 * This ensures TypeScript knows about the 'role' field on User.
 *
 * @see ADR-007: Auth Framework Design
 */

declare module 'next-auth' {
  /**
   * Extend the built-in session types to include custom properties.
   * The User object in session will include the role field.
   */
  interface Session {
    user: {
      /** User's ID from database */
      id: string;
      /** User's role for RBAC */
      role: string;
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in User type to include custom properties.
   */
  interface User {
    /** User's role for RBAC */
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT type to include custom properties.
   * These are stored in the JWT token.
   */
  interface JWT {
    /** User's ID from database */
    id?: string;
    /** User's role for RBAC */
    role?: string;
  }
}
