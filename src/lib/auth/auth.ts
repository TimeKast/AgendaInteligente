/**
 * NextAuth.js v5 Configuration
 *
 * Complete authentication setup with:
 * - Credentials (password)
 * - Magic Link (email)
 * - OAuth (Google, GitHub)
 *
 * Just configure .env.local and use!
 *
 * @see ADR-007: Auth Framework Design
 */

import { logger } from '@/lib/logger';

import NextAuth from 'next-auth';
import type { User, Account, Profile } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { AdapterUser } from 'next-auth/adapters';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Email from 'next-auth/providers/email';

import { sendEmail, isEmailReady } from '@/lib/email';
import { magicLinkEmail, magicLinkEmailText } from '@/lib/email/templates/magic-link';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { isDatabaseConfigured } from '@/lib/env';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { authFeatures, getGoogleCredentials, getGitHubCredentials } from '@/config/auth-features';
import { getDefaultRole } from '@/config/roles';
import { logAuditEvent } from '@/lib/audit';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { hashPassword, verifyPassword } from './utils';

// =============================================================================
// Drizzle Adapter (conditional)
// =============================================================================

/**
 * Create Drizzle adapter only when DATABASE_URL is configured.
 * This allows the app to build without a database connection.
 */
function createAdapter() {
  if (!isDatabaseConfigured()) {
    logger.warn('DATABASE_URL not configured. Auth adapter disabled.');
    return undefined;
  }

  return DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Fetch profile image from Google API (fallback for Workspace orgs)
 *
 * Google Workspace organizations may restrict profile.picture in OAuth.
 * This fetches the image directly from the Google API as a fallback.
 */
async function fetchGoogleProfileImage(
  accessToken: string,
  email?: string | null
): Promise<string | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      const userInfo = await response.json();
      logger.info(`[Auth] Fetched image from Google API for ${email || 'unknown'}`);
      return userInfo.picture || null;
    }
  } catch (error) {
    logger.error('[Auth] Failed to fetch Google userinfo', { error });
  }
  return null;
}

// =============================================================================
// NextAuth Configuration
// =============================================================================

import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  // Drizzle adapter for database sessions (only when configured)
  adapter: createAdapter(),

  // =============================================================================
  // Providers
  // =============================================================================
  providers: [
    // -------------------------------------------------------------------------
    // Credentials Provider (Password)
    // -------------------------------------------------------------------------
    ...(authFeatures.providers.credentials
      ? [
          Credentials({
            name: 'credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials: Record<string, unknown> | undefined, request: Request) {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }

              // Check if database is configured
              if (!isDatabaseConfigured()) {
                logger.error('Credentials login requires DATABASE_URL');
                return null;
              }

              // Rate limit BEFORE bcrypt — bcrypt is the expensive op we're protecting.
              // KIT-020 §B: blocks brute-force at the IP level. Returns null on hit
              // (same as bad credentials) so attackers get no signal whether the
              // failure was rate-limit or wrong password.
              const ip = getClientIP(request);
              const rateLimit = await checkRateLimit(ip, 'auth');
              if (!rateLimit.success) {
                logger.warn(`[Auth] login rate-limit hit for ip=${ip}`);
                return null;
              }

              const email = (credentials.email as string).toLowerCase();
              const password = credentials.password as string;

              // Regular user login
              const user = await db.query.users.findFirst({
                where: eq(users.email, email),
              });

              if (!user || !user.password) {
                return null;
              }

              const isValid = await verifyPassword(password, user.password);
              if (!isValid) {
                return null;
              }

              // Check soft-deleted users
              if (user.deletedAt) {
                throw new Error('AccountDisabled');
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              };
            },
          }),
        ]
      : []),

    // -------------------------------------------------------------------------
    // Google OAuth (only if configured)
    // -------------------------------------------------------------------------
    ...(authFeatures.providers.google
      ? [
          (() => {
            const { clientId, clientSecret } = getGoogleCredentials();
            return Google({
              clientId,
              clientSecret,
              // Allow linking OAuth to existing email accounts
              // SECURITY NOTE: This allows automatic account linking when an OAuth
              // provider reports the same email as an existing account. This is safe
              // because Google verifies email ownership before including it in the
              // OAuth profile. Disabling this causes 'OAuthAccountNotLinked' errors
              // for users who registered with email/password and later try Google login.
              allowDangerousEmailAccountLinking: true,
              // Request explicit scopes including profile picture
              // Note: Google Workspace orgs may restrict profile picture sharing
              authorization: {
                params: {
                  scope: 'openid email profile',
                  prompt: 'select_account', // Always show account picker
                },
              },
              profile(profile) {
                return {
                  id: profile.sub,
                  name: profile.name,
                  email: profile.email,
                  image: profile.picture,
                };
              },
            });
          })(),
        ]
      : []),

    // -------------------------------------------------------------------------
    // GitHub OAuth (only if configured)
    // -------------------------------------------------------------------------
    ...(authFeatures.providers.github
      ? [
          (() => {
            const { clientId, clientSecret } = getGitHubCredentials();
            return GitHub({
              clientId,
              clientSecret,
              // Allow linking OAuth to existing email accounts
              // SECURITY NOTE: See Google provider above for risk documentation
              allowDangerousEmailAccountLinking: true,
            });
          })(),
        ]
      : []),

    // -------------------------------------------------------------------------
    // Email (Magic Link) - Uses SMTP (custom or Resend's SMTP gateway)
    // -------------------------------------------------------------------------
    ...(authFeatures.providers.email && isEmailReady()
      ? [
          (() => {
            // Build SMTP server config based on EMAIL_PROVIDER
            const emailProvider = process.env.EMAIL_PROVIDER;
            let serverConfig;

            if (emailProvider === 'resend') {
              // Resend SMTP gateway
              serverConfig = {
                host: 'smtp.resend.com',
                port: 465,
                secure: true,
                auth: {
                  user: 'resend',
                  pass: process.env.RESEND_API_KEY || '',
                },
              };
            } else if (emailProvider === 'smtp') {
              // Custom SMTP config
              serverConfig = {
                host: process.env.EMAIL_SERVER_HOST || '',
                port: Number(process.env.EMAIL_SERVER_PORT) || 587,
                secure: process.env.EMAIL_SERVER_SECURE === 'true',
                auth: process.env.EMAIL_SERVER_USER
                  ? {
                      user: process.env.EMAIL_SERVER_USER,
                      pass: process.env.EMAIL_SERVER_PASSWORD || '',
                    }
                  : undefined,
              };
            } else {
              // Fallback (shouldn't reach here due to isEmailReady check)
              return null;
            }

            return Email({
              server: serverConfig,
              from:
                process.env.EMAIL_FROM ||
                (() => {
                  throw new Error('EMAIL_FROM is required when email provider is configured');
                })(),
              sendVerificationRequest: async ({ identifier: email, url, provider }) => {
                // ── Registration Gate ──
                // Silently drop magic links for unregistered users when registration is disabled
                // This prevents email enumeration attacks
                if (!authFeatures.features.registration) {
                  const existingUser = await db.query.users.findFirst({
                    where: eq(users.email, email),
                  });
                  if (!existingUser) {
                    logger.warn(`[Auth] Magic link blocked for ${email} (registration disabled)`);
                    return; // Silent — prevents email enumeration
                  }
                }

                const host = new URL(url).host;
                const result = await sendEmail({
                  to: email,
                  subject: `Inicia sesión en ${process.env.NEXT_PUBLIC_APP_NAME || 'App'}`,
                  html: magicLinkEmail({ url, host }),
                  text: magicLinkEmailText({ url, host }),
                });
                if (!result.success) {
                  logger.error('[Magic Link] Failed to send:', result.error);
                  throw new Error(`Email(${provider.from}) could not be sent`);
                }
              },
            });
          })(),
        ].filter((p): p is NonNullable<typeof p> => p !== null)
      : []),
  ],

  // =============================================================================
  // Callbacks
  // =============================================================================
  callbacks: {
    // Inherit Edge-safe callbacks (JS spread replaces the whole object, no deep merge)
    session: authConfig.callbacks.session,
    authorized: authConfig.callbacks.authorized,

    /**
     * Redirect callback — Default landing post-signin.
     *
     * - Same-origin URLs (relative or absolute) are respected.
     * - Cross-origin → fall back to /today.
     *
     * Onboarding-vs-app branching (US-001) lives in the /today Server
     * Component (ISSUE-006), not here — at redirect time the session token
     * isn't readable, so we can't check onboarding_completed_at.
     */
    redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/today`;
    },

    /**
     * JWT callback — Extends Edge-safe base with DB-dependent logic.
     * Base (auth.config.ts): maps token.id, token.role, token.picture
     * This override: syncs image from DB on signIn/signUp/update
     */
    async jwt(params: {
      token: JWT;
      user?: User | AdapterUser;
      trigger?: 'signIn' | 'signUp' | 'update';
      session?: { role?: string };
    }) {
      // Run base Edge-safe callback first (token.id, token.role, token.picture)
      const token = authConfig.callbacks.jwt(params);

      // DB-dependent: sync image on signIn/signUp/update (not every request)
      if (
        (params.trigger === 'signIn' ||
          params.trigger === 'signUp' ||
          params.trigger === 'update') &&
        token.id &&
        isDatabaseConfigured()
      ) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
          columns: { image: true },
        });
        if (dbUser) {
          token.picture = dbUser.image || token.picture;
        }
      }

      return token;
    },

    /**
     * Sign in callback - Handle OAuth user creation
     */
    async signIn({
      user,
      account,
      profile,
    }: {
      user: User | AdapterUser;
      account?: Account | null;
      profile?: Profile;
    }) {
      // Skip if no database
      if (!isDatabaseConfigured()) {
        return true;
      }

      // For OAuth providers, check/set role and sync profile data
      if (account?.provider !== 'credentials' && user.email) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        // ── Registration Gate ──
        // Block OAuth account creation when registration is disabled
        if (!existingUser && !authFeatures.features.registration) {
          logger.warn(
            `[Auth] Registration blocked for ${user.email} via ${account?.provider} (registration disabled)`
          );
          return '/login?error=RegistrationDisabled';
        }

        if (existingUser) {
          // Build update object for missing fields
          const updates: { name?: string; image?: string; googleOauthId?: string } = {};

          // Sync Name if missing
          if (!existingUser.name && profile?.name) {
            updates.name = profile.name as string;
          }

          // AgendaInteligente: persist Google `sub` claim for fast lookups
          // without joining accounts (BR-1 multi-tenant query pattern).
          // The kit's accounts table still stores the canonical OAuth link;
          // google_oauth_id is a denormalized shortcut keyed off users.
          if (
            account?.provider === 'google' &&
            !existingUser.googleOauthId &&
            account?.providerAccountId
          ) {
            updates.googleOauthId = account.providerAccountId;
          }

          // Sync Image - try multiple sources (only if no custom avatar)
          if (!existingUser.avatarData) {
            // Get image from OAuth profile (Google: picture, GitHub: avatar_url)
            let oauthImage =
              (profile as { picture?: string })?.picture ||
              (profile as { avatar_url?: string })?.avatar_url ||
              user.image;

            // FALLBACK: If no image, fetch directly from Google API
            // This is needed for Google Workspace orgs that restrict profile.picture in OAuth
            if (!oauthImage && account?.provider === 'google' && account?.access_token) {
              oauthImage =
                (await fetchGoogleProfileImage(account.access_token, user.email)) || undefined;
            }

            // Update if image changed or doesn't exist
            if (oauthImage && oauthImage !== existingUser.image) {
              updates.image = oauthImage;
            }
          }

          // Apply updates if any
          if (Object.keys(updates).length > 0) {
            await db.update(users).set(updates).where(eq(users.id, existingUser.id));
            logger.info(
              `[Auth] Synced ${Object.keys(updates).join(', ')} for user ${user.email} from ${account?.provider}`
            );
          }
        }
      }

      return true;
    },
  },

  // =============================================================================
  // Events
  // =============================================================================
  events: {
    /**
     * Sign in event - Log successful logins
     */
    async signIn({ user, account }: { user: User; account?: Account | null }) {
      if (user.email && user.id) {
        await logAuditEvent({
          event: 'login_success',
          userId: user.id,
          email: user.email,
          metadata: { provider: account?.provider || 'credentials' },
        });
      }
    },

    /**
     * Create user event - Set default role for new users
     */
    async createUser({ user }: { user: User }) {
      // Skip if no database
      if (!isDatabaseConfigured()) {
        return;
      }

      if (user.email && user.id) {
        // Check if user already has a role (e.g., seeded super_admin)
        // Only set the default role if no role exists yet
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
          columns: { role: true, humanId: true },
        });
        const currentRole = existingUser?.role;
        const defaultRole = getDefaultRole();

        // Build update object
        const updates: { role?: string; humanId?: string } = {};

        // Preserve existing role if it's not the schema default
        // This prevents overwriting super_admin roles set by seed
        if (!currentRole || currentRole === defaultRole) {
          updates.role = defaultRole;
        }

        // Generate human ID if not already set (seed sets it manually)
        if (!existingUser?.humanId) {
          const { getNextHumanId, HUMAN_ID_PREFIXES } = await import('@/lib/utils/human-id');
          updates.humanId = await getNextHumanId(db, 'user_human_id_seq', {
            prefix: HUMAN_ID_PREFIXES.USER,
            includeYear: false,
          });
        }

        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.id, user.id));
        }

        // Log account creation
        await logAuditEvent({
          event: 'account_created',
          userId: user.id,
          email: user.email,
        });
      }
    },

    /**
     * Link account event - Sync profile image + google_oauth_id when OAuth
     * account is linked. Runs on first OAuth signup (after createUser) and
     * when a user links an additional OAuth provider to an existing account.
     */
    async linkAccount({ user, account, profile }) {
      if (!isDatabaseConfigured()) return;

      const updates: { image?: string; googleOauthId?: string } = {};

      // AgendaInteligente: cache Google `sub` claim on the user row for
      // fast lookups without joining accounts (BR-1).
      if (account.provider === 'google' && account.providerAccountId) {
        updates.googleOauthId = account.providerAccountId;
      }

      let profileImage =
        (profile as { picture?: string })?.picture ||
        (profile as { avatar_url?: string })?.avatar_url;

      // Fallback to Google API for Workspace accounts
      if (!profileImage && account.provider === 'google' && account.access_token) {
        profileImage =
          (await fetchGoogleProfileImage(account.access_token, user.email)) || undefined;
      }

      // Don't overwrite image if user has a custom avatar
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, user.id!),
        columns: { avatarData: true },
      });

      if (profileImage && !existingUser?.avatarData) {
        updates.image = profileImage;
      }

      if (user.id && Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, user.id));
        logger.info(
          `[Auth] Synced ${Object.keys(updates).join(', ')} for ${user.email} via linkAccount`
        );
      }
    },
  },

  // Debug mode (opt-in via AUTH_DEBUG=true)
  debug: process.env.AUTH_DEBUG === 'true',
});

// =============================================================================
// Helper Exports
// =============================================================================

export { hashPassword, verifyPassword };
