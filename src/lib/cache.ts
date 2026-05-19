/**
 * Cache Policy Helpers
 *
 * Defines which routes should never be cached.
 * Used by API client and fetch wrappers.
 */

export const SENSITIVE_API_PREFIXES = [
  '/api/auth',
  '/api/billing',
  '/api/user/profile',
  '/api/admin',
] as const;

export function isSensitiveApiRoute(path: string): boolean {
  return SENSITIVE_API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Usage in fetch:
 *
 * const cache = isSensitiveApiRoute(url) ? 'no-store' : 'default';
 * fetch(url, { cache });
 */
