/**
 * Token encryption helpers — ISSUE-090 / BR-12 / BR-20 (Slice A1).
 *
 * AES-256-GCM authenticated encryption for OAuth tokens stored at rest in
 * `calendar_connections.access_token` / `refresh_token` (BYTEA columns).
 *
 * Why app-layer crypto (not pgcrypto):
 *   - The key never traverses SQL (no leak via slow-query / pg_stat logs).
 *   - Zero extension dependency (Neon's allowed-extensions list is
 *     mutable and previously blocked pgvector; we don't want our token
 *     security blocked on infra capabilities).
 *   - Key rotation = re-encrypt rows from the app (we can stream + batch).
 *
 * Format on disk (concatenated, `bytea`):
 *
 *   [ IV (12 bytes) ][ authTag (16 bytes) ][ ciphertext (N bytes) ]
 *
 * AES-256-GCM with a random 96-bit IV per encryption (the GCM spec's
 * recommended size — wider IVs waste bandwidth, narrower break the
 * birthday bound). The 128-bit auth tag is fixed-size — any in-place
 * mutation of the cipher fails `decryptToken` with an integrity error.
 *
 * Key shape: `ENCRYPTION_KEY` env var must decode (base64) to exactly
 * 32 bytes. Validated at module-load via `getEncryptionKey()` so a
 * mis-configured env crashes loud before anyone tries to encrypt junk.
 *
 * Generate one with: `openssl rand -base64 32`.
 *
 * Linked: BR-12, BR-20, E-060, U-007.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getEncryptionKey } from '@/lib/env';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;

/**
 * Decode the base64-encoded env key into a 32-byte Buffer. Throws on
 * shape mismatch — the caller's flow is dead until env is fixed, so we
 * fail loud rather than silently truncating.
 */
function loadKey(): Buffer {
  const raw = getEncryptionKey();
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${key.length}). Generate with: openssl rand -base64 32`
    );
  }
  return key;
}

/**
 * Encrypt a plaintext token (UTF-8 string). Returns the concatenated
 * IV || authTag || ciphertext as a Buffer suitable for `bytea` storage.
 *
 * Each call uses a fresh random IV — calling twice on the same plaintext
 * yields different ciphers (deterministic-encryption would leak which
 * users share an OAuth token, however unlikely).
 */
export function encryptToken(plaintext: string): Buffer {
  if (typeof plaintext !== 'string') {
    throw new TypeError('encryptToken expects a string');
  }
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

/**
 * Decrypt a Buffer previously returned by `encryptToken`. Throws if the
 * key is wrong, the auth tag fails verification (tamper), or the input
 * shape is malformed.
 */
export function decryptToken(blob: Buffer | Uint8Array): string {
  // Drizzle bytea reads may surface as Uint8Array depending on driver —
  // coerce defensively so callers don't have to remember the cast.
  if (!Buffer.isBuffer(blob)) {
    if (blob instanceof Uint8Array) {
      blob = Buffer.from(blob);
    } else {
      throw new TypeError('decryptToken expects a Buffer / Uint8Array');
    }
  }
  if (blob.length < IV_BYTES + AUTH_TAG_BYTES + 1) {
    throw new Error('decryptToken input too short to be a valid cipher');
  }
  const key = loadKey();
  const iv = blob.subarray(0, IV_BYTES);
  const authTag = blob.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const ciphertext = blob.subarray(IV_BYTES + AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
