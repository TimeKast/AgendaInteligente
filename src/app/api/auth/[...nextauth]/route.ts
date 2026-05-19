/**
 * NextAuth.js API Route Handler
 *
 * Handles all auth-related API routes:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback/*
 * - /api/auth/session
 * - etc.
 *
 * @see https://authjs.dev/getting-started/installation
 */

import { handlers } from '@/lib/auth/auth';

export const { GET, POST } = handlers;
