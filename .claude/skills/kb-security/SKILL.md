---
name: kb-security
last-verified: 2026-04-23
description: Portable defensive auth + authorization + input-validation patterns for NextAuth.js v5 + Next.js 16+ apps — defense-in-depth layering, RBAC modeling, Zod at every boundary, attack prevention (SQLi/XSS/CSRF), session verification, password-reset security, server-only env hygiene. Invoke when wiring generic NextAuth + Zod security or reviewing code for common vulns in a derived project without the kit's `withAuth` primitives. → `sk-security` for kit-shipped infra; → `kb-security-audit` for offensive/adversarial review.
---

# kb-security — Portable Auth + Validation Patterns

> Stack: NextAuth.js v5 (beta), Zod, Next.js 16+ middleware + Server Actions.
> **Portable** — these patterns work in any project on this stack, with or without the Starter Kit.
>
> Pair: [`sk-security`](../sk-security/SKILL.md) — for kit-shipped primitives (`auth.config.ts` split, `ROLE_CONFIG`, `requirePermission`, `withAuth`/`withSelf`, rate-limit, audit logging, Security Headers). For `ActionResult` / `ActionError` shapes see [`sk-api`](../sk-api/SKILL.md). For adversarial threat modeling see [`kb-security-audit`](../kb-security-audit/SKILL.md) + `security-auditor` agent.

---

## 1. Core principles

1. **Defense in depth** — three layers minimum: middleware/`authorized()` callback (Edge) + page guard (`auth()` + route check) + server-action check. Never one layer alone.
2. **Least privilege** — the default role must not have write access to anything outside its own resources.
3. **Never trust input** — Zod parse at every boundary (action input, API body, form data).
4. **Fail securely** — generic error to the user, structured log internally. Never leak stack traces, internal paths, or raw DB errors.
5. **Audit everything** — log security-relevant events (logins, role changes, privileged actions, data exports).

---

## 1.1 RBAC modeling — roles × actions matrix before code

Before any permission code ships, model the authorization space as a matrix. Roles on one axis, resource/action pairs on the other. The matrix is the design artifact — `ROLE_CONFIG` / `PERMISSIONS` constants are the implementation.

| Role          | `user:read` | `user:write` | `user:delete` | `billing:read` | `billing:write` | `audit:read` |
| ------------- | :---------: | :----------: | :-----------: | :------------: | :-------------: | :----------: |
| `guest`       |      —      |      —       |       —       |       —        |        —        |      —       |
| `user` (self) |  own only   |   own only   |       —       |    own only    |        —        |      —       |
| `admin`       |      ✓      |      ✓       |   soft only   |       ✓        |        ✓        |      ✓       |
| `super_admin` |      ✓      |      ✓       |    hard ok    |       ✓        |        ✓        |      ✓       |

Rules the matrix enforces at design time:

1. **Name actions by verb + resource**, not by route — `billing:write`, not `POST /api/billing`. Routes change; the authorization intent doesn't.
2. **Distinguish `own` from `any`** — self-service (`updateOwnProfile`) and admin-service (`updateAnyUser`) are two entries, not one with a "does the id match?" branch inside.
3. **Model deny explicitly** — leaving a cell blank is ambiguous; `—` (no permission) vs `own` vs `✓` removes guessing.
4. **Default deny** — a new action not in the matrix must be rejected, not silently allowed. The check function throws on unknown `(role, action)` pairs.
5. **No role inheritance implicit in code** — if `admin` should have everything `user` has, write it twice or compute it from a helper. Inheritance hidden behind `>=` numeric comparison breaks the moment a role gets a narrower scope than its "parent."
6. **Matrix lives with the product docs** — changes to the matrix require the same review as schema changes. Code drift from matrix = security bug.

> For the kit's exact shape (`ROLE_CONFIG`, `requirePermission`, `withAuth({ permission })`) see [`sk-security`](../sk-security/SKILL.md). The matrix above is the portable design — the kit's constants are one concrete implementation.

---

## 2. NextAuth v5 — the split-config pitfalls (framework-level, not kit-level)

These pitfalls apply to any NextAuth v5 project that uses middleware + Server Actions. Kit-specific paths aside, the pattern is framework-native:

### Pitfall A — Edge-relevant callbacks must live in the config consumed by middleware

If `jwt()` / `session()` / `authorized()` live only in the Node file (where DB adapters are wired), the middleware's NextAuth instance — built from the Edge-safe config alone — never populates `auth.user.role` / `auth.user.id`. Route ACL silently becomes "authenticated = allowed."

**Rule:** Edge-safe `auth.config.ts` owns the callbacks that the middleware depends on. The Node `auth.ts` extends with DB adapter + providers and **preserves** those callbacks.

### Pitfall B — object spread replaces the whole `callbacks` key

`{ ...authConfig, callbacks: { jwt, signIn } }` is **not** a deep merge. Any callback not re-listed is dropped.

```ts
// ❌ loses session + authorized from authConfig
export const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt(p) {
      /*…*/
    },
  },
});

// ✅ preserve explicitly, compose jwt
export const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    session: authConfig.callbacks.session,
    authorized: authConfig.callbacks.authorized,
    async jwt(params) {
      const token = authConfig.callbacks.jwt(params);
      // DB-dependent additions
      return token;
    },
  },
});
```

### `trustHost` on reverse-proxied hosts

Providers like Vercel set `VERCEL=1`. Set `trustHost: true` when behind a trusted proxy; otherwise NextAuth rejects callbacks on auto-assigned URLs.

> For the kit's exact file structure and callback bodies see [`sk-security`](../sk-security/SKILL.md) §1.

---

## 3. Session verification patterns

### Server Component / page

```ts
import { auth } from '@/lib/auth'; // or wherever the project's barrel lives
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  // ...then a role/permission check appropriate to your app
  return <div>Welcome {session.user.name}</div>;
}
```

### Server Action — manual pattern (no wrapper)

```ts
'use server';
import { auth } from '@/lib/auth';

export async function listUsers() {
  const session = await auth();
  if (!session?.user) throw new Error('UNAUTHORIZED');
  // ...role/permission check appropriate to your app
  return db.select().from(users);
}
```

> For the kit's `withAuth({ permission })` wrapper that bundles auth + permission + Zod parse + revalidate, see [`sk-api`](../sk-api/SKILL.md).

---

## 4. Input validation — Zod at every boundary

### API Route

```ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'ValidationError', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  // …
}
```

### Server Action

```ts
'use server';
const schema = z.object({ email: z.string().email(), name: z.string().min(1).max(100) });

export async function createUser(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');
  // …
}
```

### Sanitization (HTML content)

If the project needs rich-text, sanitize explicitly — never trust client-sent HTML:

```ts-example
import DOMPurify from 'isomorphic-dompurify';
function sanitizeHtml(dirty: string) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}
```

For plain search queries — length-cap + strip dangerous characters:

```ts
const sanitizeSearchQuery = (q: string) => q.trim().slice(0, 100).replace(/[<>]/g, '');
```

---

## 5. Common attack prevention

### SQL Injection — always parameterize

```ts
// ❌ never — string interpolation
await db.execute(sql`SELECT * FROM users WHERE id = '${userId}'`);

// ✅ always — ORM binds parameters
await db.select().from(users).where(eq(users.id, userId));
```

### XSS — let React escape by default

```tsx
// ❌ raw insert of user content
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ let React escape
<div>{userContent}</div>

// ✅ if HTML is truly needed, sanitize (see §4)
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

### CSRF

Server Actions in Next.js 14+ ship CSRF protection via same-site cookies. For custom mutating API Routes, verify `Origin`:

```ts
const origin = request.headers.get('origin');
if (origin !== expectedOrigin) {
  return Response.json({ error: 'CSRF' }, { status: 403 });
}
```

> CSRF surface to keep in mind: Server Actions are protected because they're invoked via `fetch` from same-origin JS with same-site cookies. Raw browser `<form action="/api/...">` posting to a custom route has no such guarantee — any mutating custom route must validate `Origin` / `Referer` explicitly or require a CSRF token.

---

## 6. Password reset — portable security patterns

Password reset is one of the highest-risk flows in any auth system — it's an account takeover primitive if built wrong. Regardless of kit or framework, follow these patterns:

| Pattern                           | Rule                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **No user enumeration**           | Always respond the same way whether the email exists or not (e.g. "If an account exists, we sent a reset link"). Same status + timing. |
| **Token is a server secret**      | Generate ≥32 bytes of CSPRNG randomness. Send the plaintext token by email; store only a hash (SHA-256) in the DB.                     |
| **One-time use**                  | Delete or invalidate the token row the moment it is consumed. Reuse attempts must fail even within TTL.                                |
| **Short expiration**              | 15 min – 1 hour. Long TTLs widen the attack window if an email is later compromised.                                                   |
| **Invalidate on new request**     | A fresh reset request overwrites / deletes any prior pending token for that user.                                                      |
| **Invalidate on password change** | Successful reset invalidates all existing sessions (force re-login).                                                                   |
| **Rate limit both endpoints**     | `/forgot-password` (per IP + per email) and `/reset-password` (per IP + per token). Prevents enumeration via timing + brute force.     |
| **Log, don't leak**               | Log failure reasons server-side (unknown email, expired, consumed); to the user, return the same generic message for all branches.     |

```ts
// ✅ constant-response, hashed token
export async function requestReset(email: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (user) {
    const token = crypto.randomBytes(32).toString('base64url');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await db.insert(resetTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await sendResetEmail(email, token); // plaintext goes to the inbox, never to the DB
  }
  return { ok: true }; // same response whether user existed or not
}
```

---

## 7. Server-only variables — never cross the bundle boundary

Next.js inlines any `process.env.X` referenced from a Client Component (or imported by one) into the client bundle. Secrets leaked this way are public the instant the site deploys.

```
✅ Server-only:   AUTH_SECRET, DATABASE_URL, RESEND_API_KEY, VAPID_PRIVATE_KEY,
                  OAUTH client secrets, webhook signing keys, admin seed emails
✅ Client-safe:   anything prefixed NEXT_PUBLIC_* (VAPID public key, public app URL,
                  feature flags that are already visible in network traffic)
```

### Rules

1. **Never reference `process.env.SECRET_*` from a Client Component** — not directly, not through an imported helper. If a module reads a server secret at top level, it cannot be imported by any `'use client'` file, transitively.
2. **Use `import 'server-only'`** at the top of modules that read secrets. It throws at build time if a Client Component ever imports them.
3. **Validate env at startup** — parse `process.env` through a Zod schema in one place (e.g. `env.ts`), and have the rest of the app import typed values. Missing/malformed secrets fail fast instead of crashing in production under load.
4. **Audit the client bundle** — `grep -r "process.env.SECRET_" .next/static/` after build should return nothing. Any hit is a leak.
5. **Don't use `NEXT_PUBLIC_*` to "expose when needed"** — the prefix is a one-way door. Once a value ships with that prefix, assume it's permanently public.

```ts
// ✅ server-only module — throws if imported client-side
import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  RESEND_API_KEY: z.string().startsWith('re_'),
});

export const env = envSchema.parse(process.env);
```

---

## 8. Checklists

### Pre-deploy (portable items)

- [ ] Auth secret set and ≥32 random bytes (`openssl rand -base64 32`)
- [ ] Database URL points at production, not staging
- [ ] OAuth redirect URIs registered with provider (Google / GitHub console)
- [ ] `NEXT_PUBLIC_APP_URL` (or equivalent) matches production origin
- [ ] No secrets committed — grep `git log -p | grep -i 'SECRET\|DATABASE_URL\|API_KEY'`
- [ ] Rate limiting enabled on login, signup, password reset, webhooks

### Code review (portable items)

- [ ] Input validated with Zod at boundary (server action, API route)
- [ ] Queries use ORM query builder or parameterized SQL — no raw string interpolation
- [ ] Server-side permission check present — not just UI gating
- [ ] `revalidatePath` (or equivalent) listed for mutations that affect cached lists
- [ ] Audit event logged for security-relevant mutations (role change, user delete, privileged action)
- [ ] No `console.log` of passwords, tokens, full session, or raw DB errors
- [ ] Error messages to user are generic; stack traces only to structured logs

---

## 9. Anti-patterns (portable)

| ❌                                                         | ✅                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| Client-only auth check / gating UI without server re-check | Re-check server-side (`auth()` + permission check)            |
| SQL string interpolation                                   | ORM query builder / parameterized SQL                         |
| Secrets in code / committed files                          | `.env.local` + loader + Zod validation                        |
| Importing `process.env.SECRET_*` into a client component   | `import 'server-only'` guard + typed `env` module             |
| `NEXT_PUBLIC_*` used to "temporarily expose" a secret      | Never — prefix is a permanent public contract                 |
| `any` on action input                                      | Zod schema → typed `parsed`                                   |
| Raw `dangerouslySetInnerHTML` on user content              | Let React escape, or sanitize with an allow-list              |
| Logging passwords / tokens / full session cookies          | Structured logs with whitelisted fields                       |
| Stack traces surfaced to the user                          | Generic user message + `logger.error` with context            |
| Password reset enumerates valid emails by response/timing  | Constant response + rate-limit both request and consume steps |
| Password reset stores plaintext tokens in DB               | Store SHA-256 hash; plaintext only in the email               |
| Trusting `Origin` headers from same-origin only            | Explicit validation of `Origin` on mutating routes            |
| Role inheritance hidden behind numeric `>=` comparison     | Explicit matrix (roles × actions) with default-deny           |
| Storing plain passwords                                    | `bcrypt` / `argon2` hashing with per-password salt            |

---

_Cross-reference: [`sk-security`](../sk-security/SKILL.md) — kit-shipped infra (`auth.config.ts` split, `ROLE_CONFIG`, `requirePermission`, `withAuth`/`withSelf`, rate-limit, audit logging, Security Headers). [`sk-features-index`](../sk-features-index/SKILL.md) — feature catalog. [`sk-api`](../sk-api/SKILL.md) / [`kb-api`](../kb-api/SKILL.md) — server-action / API patterns. [`kb-security-audit`](../kb-security-audit/SKILL.md) + `security-auditor` agent — offensive / adversarial review._
