---
name: security
description: Authentication, authorization, RBAC, input validation, attack prevention
---

# 🔒 Security Skill

> **Dominio:** Auth, permisos, validación, vulnerabilidades.
> **Stack:** NextAuth.js v5, Zod, middleware.

---

## Principios Fundamentales

1. **Defense in depth** — múltiples capas de protección
2. **Principle of least privilege** — mínimo acceso necesario
3. **Never trust input** — validar TODO
4. **Fail securely** — errores no exponen info sensible
5. **Audit everything** — log de acciones críticas

---

## SIEMPRE / NUNCA

**SIEMPRE:**

1. Verificar auth en entry points (`await auth()`)
2. Validar permisos antes de operaciones
3. Sanitizar input antes de DB/email/logs
4. Rate limit endpoints sensibles

**NUNCA:**

1. Confiar en input del cliente sin validar
2. Exponer IDs internos (UUIDs en URLs)
3. Loggear tokens, passwords, o PII
4. Bypass de auth "temporal" en desarrollo

---

## Autenticación (NextAuth.js v5)

### 🔴 Split-Config Pattern (OBLIGATORIO)

NextAuth v5 requiere separar la config en 2 archivos para soportar Edge (middleware) y Node (server actions):

```
auth.config.ts  →  Edge-safe (NO imports de DB)
     ↓                Callbacks: jwt(), session(), authorized()
     ↓                Usado por: middleware.ts → NextAuth(authConfig)
     ↓
auth.ts         →  Node runtime (con DB)
     ↓                Hereda: ...authConfig
     ↓                Extiende: jwt() con lógica de DB, signIn() con OAuth
     ↓                Usado por: server actions, API routes
```

### ⚠️ PITFALL 1: Callbacks faltantes en auth.config.ts

> Si `jwt()` y `session()` solo están en `auth.ts`, el middleware **nunca** tendrá
> `req.auth.user.role` — siempre será `undefined`. El middleware usa su propia
> instancia de NextAuth con solo `authConfig`, que no tiene esos callbacks.

```typescript
// ❌ MAL — callbacks solo en auth.ts
// auth.config.ts
export const authConfig = {
  callbacks: {
    authorized() {
      /* ... */
    },
    // ← falta jwt() y session()
  },
};

// ✅ BIEN — callbacks Edge-safe en auth.config.ts
// auth.config.ts
import { getDefaultRole } from '@/config/roles';

export const authConfig = {
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || getDefaultRole();
        token.picture = user.image;
      }
      if (trigger === 'update' && session) {
        token.role = session.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.picture;
      }
      return session;
    },
    authorized({ auth }) {
      /* ... */
    },
  },
};
```

### ⚠️ PITFALL 2: JS Object Spread NO hace deep merge

> Cuando `auth.ts` define `callbacks: { jwt, signIn }`, **reemplaza completamente**
> `authConfig.callbacks`. Los callbacks `session()` y `authorized()` se PIERDEN.

```typescript
// ❌ MAL — session y authorized desaparecen
export const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt(params) {
      /* ... */
    },
    async signIn() {
      /* ... */
    },
    // ← session() y authorized() de authConfig se perdieron!
  },
});

// ✅ BIEN — heredar explícitamente los callbacks que no se sobreescriben
export const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    session: authConfig.callbacks.session, // ← heredar
    authorized: authConfig.callbacks.authorized, // ← heredar
    async jwt(params) {
      const token = authConfig.callbacks.jwt(params); // componer con base
      // ... agregar lógica de DB aquí
      return token;
    },
    async signIn() {
      /* ... */
    },
  },
});
```

### trustHost Auto-Detect

```typescript
// auth.config.ts
export const authConfig = {
  // Vercel setea VERCEL=1 automáticamente en todos los deploys
  // No depender de AUTH_TRUST_HOST manual (frágil, se olvida)
  trustHost: !!process.env.VERCEL || process.env.AUTH_TRUST_HOST === 'true',
};
```

### 🔴 RBAC en Middleware: Dónde ponerlo

> Cuando un proyecto necesita **route guards por role** (ej: solo admin ve `/settings/users`),
> hacerlo en `authorized()` dentro de `auth.config.ts`, **NO** en `middleware.ts` body.

**¿Por qué?** El `authorized()` callback se ejecuta DESPUÉS de `jwt()`, así que `auth.user.role`
ya está poblado. Es el patrón oficial de NextAuth v5 para autorización.

```typescript
// ✅ BIEN — RBAC en authorized() callback (auth.config.ts)
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user;
  const role = auth?.user?.role;

  // Public routes
  if (isPublicRoute(nextUrl.pathname)) return true;

  // Must be logged in
  if (!isLoggedIn) return false;

  // Role-based route guards
  const adminOnlyPaths = ['/settings/users', '/settings/billing'];
  if (adminOnlyPaths.some(p => nextUrl.pathname.startsWith(p))) {
    if (role !== 'admin' && role !== 'super_admin') {
      return Response.redirect(new URL('/dashboard', nextUrl));
    }
  }

  return true;
}

// ❌ MAL — RBAC en middleware.ts body
// req.auth.user.role puede ser undefined dependiendo del timing
// de los callbacks. Además, es un segundo lugar de lógica de auth.
export default auth((req) => {
  const role = req.auth?.user?.role; // ← frágil, depende de session callback
  if (role !== 'admin') { /* redirect */ }
});
```

> **SK Factory:** El `authorized()` base solo verifica login (público vs protegido).
> Los proyectos que hereden el SK deben **extender** `authorized()` con sus rutas
> y roles específicos, siguiendo el patrón de arriba.

### 🔴 2 Capas de Permisos: Route ACL vs Resource Permission

> **NUNCA** mezclar estas dos capas. Son distintas en propósito, ubicación y granularidad.

| Capa                    | Pregunta que responde                        | Dónde vive                         | Ejemplo                                            |
| ----------------------- | -------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| **Route ACL**           | "¿Puede este **role** VER esta pantalla?"    | `authorized()` en `auth.config.ts` | Solo admin ve `/configuracion/usuarios`            |
| **Resource Permission** | "¿Puede este role HACER X con este recurso?" | Server actions / API routes / UI   | Admin puede crear usuarios, user solo puede listar |

```typescript
// ✅ BIEN — Route ACL para "¿puede ver la página?"
// auth.config.ts → authorized()
const ROUTE_ACL: Record<string, Role[]> = {
  '/configuracion/usuarios': ['admin', 'super_admin'],
  '/sucursales': ['admin', 'super_admin'],
  '/datos': ['admin'],
};

function isRouteAllowed(pathname: string, role: string): boolean {
  for (const [route, allowedRoles] of Object.entries(ROUTE_ACL)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(role as Role);
    }
  }
  return true; // Si no está en ACL, acceso libre para autenticados
}

// En authorized():
if (!isRouteAllowed(nextUrl.pathname, role)) {
  return Response.redirect(new URL('/dashboard', nextUrl));
}

// ✅ BIEN — Resource Permission para "¿puede hacer esta acción?"
// En server actions / componentes
if (!hasPermission(role, 'users', 'create')) {
  throw new AppError(ERROR_CODES.FORBIDDEN);
}
```

```typescript
// ❌ MAL — Usar resource permission como route guard
// Esto permite ver la página a roles que tienen "list" pero no deberían acceder
if (!hasPermission(role, 'branches', 'list')) {
  redirect('/dashboard');
}
// ← Marketing tiene 'branches:list' pero NO debería ver /sucursales
```

**Regla de oro:**

- **¿Quién ve qué PANTALLA?** → `ROUTE_ACL` map + `isRouteAllowed()` en `authorized()`
- **¿Quién puede hacer qué ACCIÓN?** → `hasPermission()` en server actions + UI buttons

**Defense in depth:**

1. `authorized()` → primer filtro (middleware, Edge)
2. Page component → segundo filtro (`isRouteAllowed` + redirect)
3. Server action → tercer filtro (`hasPermission` por recurso)

### Verificar Sesión en Server

```typescript
// En Server Component o Server Action
import { auth } from '@/lib/auth';

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <div>Welcome {session.user.name}</div>;
}
```

### Verificar Sesión en Server Action

```typescript
'use server';

import { auth } from '@/lib/auth';
import { AppError, ERROR_CODES } from '@/lib/errors';

export async function protectedAction(data: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  // Continuar con lógica...
}
```

---

## Autorización (RBAC)

### Definir Roles y Permisos

```typescript
// lib/auth/permissions.ts
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  'users:read': [ROLES.ADMIN, ROLES.USER],
  'users:write': [ROLES.ADMIN],
  'users:delete': [ROLES.ADMIN],
  'settings:manage': [ROLES.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(role);
}
```

### Verificar Permisos

```typescript
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { AppError, ERROR_CODES } from '@/lib/errors';

export async function deleteUser(userId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  if (!hasPermission(session.user.role, 'users:delete')) {
    throw new AppError(ERROR_CODES.FORBIDDEN);
  }

  // Proceder con eliminación...
}
```

### Higher-Order Function para Permisos

```typescript
// lib/auth/withPermission.ts
import { auth } from '@/lib/auth';
import { hasPermission, type Permission } from './permissions';
import { AppError, ERROR_CODES } from '@/lib/errors';

export function withPermission<T extends (...args: any[]) => any>(
  permission: Permission,
  action: T
): T {
  return (async (...args: Parameters<T>) => {
    const session = await auth();

    if (!session?.user) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED);
    }

    if (!hasPermission(session.user.role, permission)) {
      throw new AppError(ERROR_CODES.FORBIDDEN);
    }

    return action(...args);
  }) as T;
}

// Uso
export const deleteUser = withPermission('users:delete', async (userId: string) => {
  // Ya verificado que tiene permiso
});
```

---

## Validación de Input

### Zod en Boundaries

```typescript
// SIEMPRE validar en entry points
import { z } from 'zod';

// API Route
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = userSchema.parse(body); // Throws si inválido
  // ...
}

// Server Action
export async function createUser(input: unknown) {
  const validated = userSchema.parse(input);
  // ...
}

// Form
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### Sanitización

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Para contenido que puede tener HTML
function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

// Para queries de búsqueda
function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .slice(0, 100) // Limitar longitud
    .replace(/[<>]/g, ''); // Remover caracteres peligrosos
}
```

---

## Protección contra Ataques Comunes

### SQL Injection

```typescript
// ❌ NUNCA
const users = await db.execute(`SELECT * FROM users WHERE id = '${userId}'`);

// ✅ SIEMPRE usar query builder o prepared statements
const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
```

### XSS (Cross-Site Scripting)

```typescript
// React escapa automáticamente, pero cuidado con:

// ❌ PELIGROSO
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Si es necesario, sanitizar primero
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />

// ✅ O mejor, no usar dangerouslySetInnerHTML
<div>{userContent}</div>
```

### CSRF

```typescript
// Next.js Server Actions tienen protección CSRF built-in
// Para API Routes, verificar Origin header

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (origin !== process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json({ error: 'CSRF' }, { status: 403 });
  }

  // ...
}
```

---

## Rate Limiting

```typescript
// lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10s
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
}

// En API Route
export async function POST(request: NextRequest) {
  const ip = request.ip ?? 'anonymous';
  const { success, headers } = await checkRateLimit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers });
  }

  // ...
}
```

---

## Variables de Entorno

### Naming Convention

```bash
# Server-only (NUNCA exponer al cliente)
DATABASE_URL=
AUTH_SECRET=
STRIPE_SECRET_KEY=
API_KEY=

# Public (ok exponer al cliente)
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Validación al Startup

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

---

## Logging de Seguridad

```typescript
// lib/audit.ts
import { db } from '@/lib/db/drizzle';
import { auditLogs } from '@/lib/db/schema';

type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.password_change'
  | 'user.delete'
  | 'admin.role_change'
  | 'data.export';

export async function logAuditEvent({
  action,
  userId,
  targetId,
  metadata,
  ip,
}: {
  action: AuditAction;
  userId: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  await db.insert(auditLogs).values({
    action,
    userId,
    targetId,
    metadata,
    ip,
    timestamp: new Date(),
  });
}

// Uso
await logAuditEvent({
  action: 'user.login',
  userId: user.id,
  ip: request.ip,
  metadata: { provider: 'google' },
});
```

---

## Checklist de Seguridad

### Pre-Deploy

- [ ] Secrets en variables de entorno (no en código)
- [ ] `AUTH_SECRET` es string random de 32+ chars
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad configurados

### Code Review

- [ ] Input validado con Zod
- [ ] Queries usan query builder (no SQL raw)
- [ ] Permisos verificados en server
- [ ] No hay secrets hardcodeados
- [ ] Logs no exponen datos sensibles

---

## Anti-Patrones

| ❌ Evitar                     | ✅ Preferir                   |
| ----------------------------- | ----------------------------- |
| Verificar auth solo en client | Verificar siempre en server   |
| SQL string interpolation      | Query builder / prepared      |
| Secrets en código             | Variables de entorno          |
| `any` en inputs               | Zod validation                |
| Logs con passwords            | Logs sanitizados              |
| Exponer stack traces          | Mensajes genéricos al usuario |

---

## 🔗 Colaboración

| Con           | Cuándo                                  | Acción                                 |
| ------------- | --------------------------------------- | -------------------------------------- |
| **architect** | Modelo de permisos nuevo, RBAC complejo | Cargar `@[.agent/agents/architect.md]` |
| **testing**   | Auth E2E tests, security fixtures       | Coordinar                              |
| **db**        | Row-level security, audit fields        | Coordinar                              |

---

_Skill de dominio del TimeKast Factory_
