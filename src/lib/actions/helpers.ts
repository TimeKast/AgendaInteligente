'use server';

/**
 * Server Action Helpers
 *
 * Reusable wrappers that eliminate boilerplate in server actions:
 * - `withAuth()` — For admin actions (auth + permissions + validation)
 * - `withSelf()` — For self-service actions (auth + validation, no permissions)
 *
 * @example
 * // Admin action with permissions
 * export const createUser = (input: unknown) =>
 *   withAuth(
 *     { resource: 'users', action: 'create', schema: createUserSchema, revalidate: '/settings/users' },
 *     input,
 *     async (data, userId) => {
 *       await db.insert(users).values({ ...data, createdBy: userId });
 *     }
 *   );
 *
 * @example
 * // Self-service action (no permissions check)
 * export const updateProfile = (formData: FormData) =>
 *   withSelf(
 *     { schema: profileSchema, revalidate: '/profile' },
 *     formData,
 *     async (data, userId) => {
 *       await db.update(users).set(data).where(eq(users.id, userId));
 *     }
 *   );
 *
 * @see SK-001
 */

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requirePermission, type Resource, type Action } from '@/lib/auth/permissions';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import { recordActivity } from '@/lib/notifications/activity-tracker';
import type { ZodSchema } from 'zod';

// =============================================================================
// Options
// =============================================================================

/** Options for withAuth — requires resource/action for permission check */
interface WithAuthOptions<TInput> {
  /** RBAC resource (e.g. 'users', 'posts') */
  resource: Resource;
  /** RBAC action (e.g. 'create', 'update', 'delete') */
  action: Action;
  /** Zod schema to validate input */
  schema: ZodSchema<TInput>;
  /** Path to revalidate after successful mutation */
  revalidate?: string;
}

/** Options for withSelf — no permissions, just auth */
interface WithSelfOptions<TInput> {
  /** Zod schema to validate input */
  schema: ZodSchema<TInput>;
  /** Path to revalidate after successful mutation */
  revalidate?: string;
}

/** Options for withSelf when no input validation is needed */
interface WithSelfNoSchemaOptions {
  /** Path to revalidate after successful mutation */
  revalidate?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Parse input that may be FormData or a plain object.
 *
 * @param schema - Zod schema to validate against
 * @param input - Raw input (FormData or object)
 * @returns Parsed data or error string
 */
function parseInput<TInput>(
  schema: ZodSchema<TInput>,
  input: unknown
): { data: TInput } | { error: string } {
  const raw = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message || 'Datos inválidos' };
  }

  return { data: parsed.data };
}

/**
 * Server action wrapper with auth + permissions + schema validation.
 *
 * Use for actions that require RBAC permission checks (admin CRUD operations).
 *
 * @param options - Resource, action, schema, and optional revalidate path
 * @param input - Raw input (FormData or plain object)
 * @param handler - Business logic function receiving parsed data and userId
 * @returns ActionResult with data or error
 */
export async function withAuth<TInput, TOutput = void>(
  options: WithAuthOptions<TInput>,
  input: unknown,
  handler: (parsed: TInput, userId: string) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Debes iniciar sesión' };
  }

  // Activity tracker — any authenticated user action counts as the
  // user being "in the app", which pauses the nag check-in chain for
  // today. `recordActivity` is internally throttled to 1/min, so a
  // burst of mutations doesn't hammer Postgres. Fire-and-forget so
  // the action handler isn't blocked on a notification-prefs write.
  void recordActivity(session.user.id);

  // 2. Permission check
  try {
    requirePermission(session.user.role, options.resource, options.action);
  } catch {
    // requirePermission() throws on denial — return user-friendly message (intentional)
    return { error: `No tienes permiso para ${options.action} en ${options.resource}` };
  }

  // 3. Schema validation
  const parsed = parseInput(options.schema, input);
  if ('error' in parsed) {
    return { error: parsed.error };
  }

  // 4. Execute handler
  try {
    const result = await handler(parsed.data, session.user.id);

    // 5. Revalidate cache
    if (options.revalidate) {
      revalidatePath(options.revalidate);
    }

    return { data: result };
  } catch (error) {
    if (error instanceof ActionError) {
      return { error: error.message };
    }
    console.error(`[withAuth:${options.resource}:${options.action}]`, error);
    return { error: 'Ocurrió un error. Intenta de nuevo.' };
  }
}

/**
 * Server action wrapper with auth only (no permissions).
 *
 * Use for self-service actions where the user modifies their own data
 * (profile, password, settings).
 *
 * @param options - Schema and optional revalidate path
 * @param input - Raw input (FormData or plain object)
 * @param handler - Business logic function receiving parsed data and userId
 * @returns ActionResult with data or error
 */
export async function withSelf<TInput, TOutput = void>(
  options: WithSelfOptions<TInput>,
  input: unknown,
  handler: (parsed: TInput, userId: string) => Promise<TOutput>
): Promise<ActionResult<TOutput>>;

/**
 * Server action wrapper with auth only, no input validation.
 *
 * Use for actions that only need authentication but have no user input
 * (e.g. send reset email, get current user).
 *
 * @param options - Optional revalidate path
 * @param handler - Business logic function receiving userId
 * @returns ActionResult with data or error
 */
export async function withSelf<TOutput = void>(
  options: WithSelfNoSchemaOptions,
  handler: (userId: string, email: string) => Promise<TOutput>
): Promise<ActionResult<TOutput>>;

// Implementation
export async function withSelf<TInput, TOutput = void>(
  options: WithSelfOptions<TInput> | WithSelfNoSchemaOptions,
  inputOrHandler: unknown,
  maybeHandler?: (parsed: TInput, userId: string) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Debes iniciar sesión' };
  }

  // Same activity tracking as withAuth — see the comment there for why.
  void recordActivity(session.user.id);

  const hasSchema = 'schema' in options && options.schema != null;

  try {
    let result: TOutput;

    if (hasSchema && maybeHandler) {
      // Overload 1: withSelf(options, input, handler)
      const parsed = parseInput((options as WithSelfOptions<TInput>).schema, inputOrHandler);
      if ('error' in parsed) {
        return { error: parsed.error };
      }
      result = await maybeHandler(parsed.data, session.user.id);
    } else {
      // Overload 2: withSelf(options, handler) — no schema
      const handler = inputOrHandler as (userId: string, email: string) => Promise<TOutput>;
      result = await handler(session.user.id, session.user.email ?? '');
    }

    // Revalidate cache
    if (options.revalidate) {
      revalidatePath(options.revalidate);
    }

    return { data: result };
  } catch (error) {
    if (error instanceof ActionError) {
      return { error: error.message };
    }
    console.error('[withSelf]', error);
    return { error: 'Ocurrió un error. Intenta de nuevo.' };
  }
}
