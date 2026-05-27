/**
 * OAuth state CSRF token — ISSUE-090b.
 *
 * Signs a `{ userId, exp }` payload with HMAC-SHA256 using `AUTH_SECRET`.
 * The token travels back from Google as the `state` query param and is
 * cross-checked against the httpOnly cookie set on `/connect`. Mismatch
 * or expiry → 400 invalid_state.
 *
 * Why HMAC + cookie (and not JWT lib):
 *   - Zero new deps. `AUTH_SECRET` already exists from NextAuth.
 *   - Cookie binds the state to the current browser session — even a
 *     leaked URL state can't be replayed without the cookie.
 *   - HMAC catches signature tampering; exp catches stale callbacks.
 *
 * Cookie semantics (set by the /connect route):
 *   Name:     __calendar_oauth_state
 *   HttpOnly: true
 *   SameSite: Lax  ← required: callback is a cross-site GET back to us
 *   Path:     /api/calendar
 *   Max-Age:  600 (10 min, matches `exp` in the token payload)
 *
 * Linked: BR-12, FT-090.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { getEnv } from '@/lib/env';

const TTL_SECONDS = 600;
const COOKIE_NAME = '__calendar_oauth_state';

interface StatePayload {
  userId: string;
  /** Unix seconds when this state expires. */
  exp: number;
}

function loadSecret(): string {
  const e = getEnv();
  const secret = e.AUTH_SECRET || e.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'AUTH_SECRET required to sign OAuth state. Generate with: openssl rand -base64 32'
    );
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

/** Build a signed state token. `ttlSeconds` overridable for tests. */
export function signState(userId: string, ttlSeconds: number = TTL_SECONDS): string {
  if (!userId) throw new Error('signState requires a userId');
  const payload: StatePayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const mac = createHmac('sha256', loadSecret()).update(payloadB64).digest();
  return `${payloadB64}.${b64url(mac)}`;
}

/**
 * Verify a state token. Throws an Error on:
 *   - Malformed shape (wrong number of dots / decode failure).
 *   - Signature mismatch (HMAC).
 *   - Expired payload.
 *
 * Returns the payload on success — caller compares `payload.userId` to
 * the current session's `userId` to catch cross-tenant state replay.
 */
export function verifyState(token: string): StatePayload {
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new Error('invalid_state_shape');
  }
  const [payloadB64, macB64] = token.split('.');
  if (!payloadB64 || !macB64) throw new Error('invalid_state_shape');

  const expectedMac = createHmac('sha256', loadSecret()).update(payloadB64).digest();
  let providedMac: Buffer;
  try {
    providedMac = b64urlDecode(macB64);
  } catch {
    throw new Error('invalid_state_mac');
  }
  if (providedMac.length !== expectedMac.length || !timingSafeEqual(providedMac, expectedMac)) {
    throw new Error('invalid_state_mac');
  }

  let parsed: StatePayload;
  try {
    parsed = JSON.parse(b64urlDecode(payloadB64).toString('utf8'));
  } catch {
    throw new Error('invalid_state_payload');
  }
  if (typeof parsed.userId !== 'string' || typeof parsed.exp !== 'number') {
    throw new Error('invalid_state_payload');
  }
  if (parsed.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('state_expired');
  }
  return parsed;
}

/** Cookie name constant — keeps route handlers and tests in sync. */
export const OAUTH_STATE_COOKIE = COOKIE_NAME;
export const OAUTH_STATE_TTL_SECONDS = TTL_SECONDS;
