/**
 * Server Action Types
 *
 * Shared types and error class for server actions.
 * This file is NOT a server action — it can be imported from both
 * server and client code.
 *
 * @see SK-001
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Unified return type for all server actions.
 *
 * Replaces individual result interfaces (UserAdminResult, UpdateProfileResult, etc.)
 * with a single, type-safe discriminated union.
 *
 * @example
 * // In a component
 * const result = await createUser(data);
 * if (result.error) {
 *   toast.error(result.error);
 * } else {
 *   toast.success('Created!');
 *   // result.data is available and typed
 * }
 */
export type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never };

// =============================================================================
// Errors
// =============================================================================

/**
 * Error class for user-facing action errors.
 *
 * Throw this inside a handler to return a specific error message
 * instead of the generic "Ocurrió un error" fallback.
 *
 * @example
 * handler: async (data, userId) => {
 *   const existing = await db.select(...).where(eq(users.email, data.email));
 *   if (existing.length > 0) {
 *     throw new ActionError('Ya existe un usuario con ese email');
 *   }
 * }
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}
