---
name: api
description: Server Actions, API Routes, REST endpoints, Zod validation
---

# 🔌 API Skill

> **Dominio:** API Routes, Server Actions, endpoints REST.
> **Stack:** Next.js App Router, Zod validation, Drizzle ORM.

---

## Principios Fundamentales

1. **Server Actions primero** — usar para mutaciones desde UI
2. **API Routes para externos** — webhooks, integraciones, mobile
3. **Validación Zod en boundary** — nunca confiar en input
4. **Error codes estándar** — respuestas consistentes

---

## SIEMPRE / NUNCA

**SIEMPRE:**

1. Validar input con Zod en el boundary
2. Usar Server Actions para mutaciones UI
3. Retornar error codes estándar (no strings arbitrarios)
4. Incluir `revalidatePath` o `revalidateTag` después de mutaciones

**NUNCA:**

1. Confiar en input sin validar
2. Usar `any` en tipos de respuesta
3. Exponer errores internos al cliente
4. Hacer lógica de negocio en route handlers

---

## Server Actions vs API Routes

| Server Actions                    | API Routes                |
| --------------------------------- | ------------------------- |
| Mutaciones desde UI React         | Webhooks externos         |
| Forms con progressive enhancement | API pública/mobile        |
| Integración con revalidation      | Integraciones third-party |
| Type-safe end-to-end              | REST estándar             |

---

## Server Actions

### Patrón Estándar

```typescript
// lib/actions/users.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { AppError, ERROR_CODES } from '@/lib/errors';

// Schema de validación
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export async function createUser(input: CreateUserInput) {
  // 1. Autenticación
  const session = await auth();
  if (!session?.user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  // 2. Validación
  const validated = createUserSchema.parse(input);

  // 3. Lógica de negocio
  const [user] = await db
    .insert(users)
    .values({
      ...validated,
      createdBy: session.user.id,
    })
    .returning();

  // 4. Revalidación
  revalidatePath('/users');

  return user;
}
```

### Action con Form Data

```typescript
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});

export async function submitContact(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const validated = schema.parse(raw);

  // Procesar...

  redirect('/contact/success');
}
```

---

## Delete con Verificación de Dependencias (hasMovements)

> Antes de borrar una entidad, verificar si tiene registros relacionados.

### Patrón

```typescript
export async function deleteEntity(id: string) {
  const session = await auth();
  if (!session?.user) throw new AppError(ERROR_CODES.UNAUTHORIZED);

  // 1. Verificar dependencias
  const hasMovements = await db
    .select({ count: count() })
    .from(transactions)
    .where(eq(transactions.entityId, id));

  if (hasMovements[0].count > 0) {
    throw new AppError('HAS_MOVEMENTS', 'No se puede eliminar: tiene transacciones asociadas');
  }

  // 2. Soft delete
  await db
    .update(entities)
    .set({
      deletedAt: new Date(),
      deletedBy: session.user.id,
    })
    .where(eq(entities.id, id));

  revalidatePath('/entities');
}
```

### Cuándo Aplicar

| Entidad  | Verificar antes de borrar              |
| -------- | -------------------------------------- |
| User     | Sessions, Transactions, CreatedBy refs |
| Category | Products con esa categoría             |
| Team     | Games jugados, Members                 |

### Error Code

Agregar a `ERROR_CODES`:

```typescript
HAS_MOVEMENTS: 'HAS_MOVEMENTS', // Entidad tiene registros dependientes
```

---

## API Routes

### GET con Query Params

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUsers } from '@/lib/actions/users';
import { handleApiError } from '@/lib/errors';

const querySchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    const users = await getUsers(query);

    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### POST con Body

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/actions/users';
import { handleApiError } from '@/lib/errors';

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bodySchema.parse(body);

    const user = await createUser(validated);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Route con Dynamic Params

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserById, updateUser, deleteUser } from '@/lib/actions/users';
import { handleApiError } from '@/lib/errors';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = paramsSchema.parse(await params);
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = paramsSchema.parse(await params);
    const body = await request.json();

    const user = await updateUser(id, body);
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = paramsSchema.parse(await params);
    await deleteUser(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## Error Handling

### Error Codes Estándar

```typescript
// lib/errors/codes.ts
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Business Logic
  GAME_STARTED: 'GAME_STARTED',
  PERIOD_LOCKED: 'PERIOD_LOCKED',
  TEAM_ALREADY_USED: 'TEAM_ALREADY_USED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

### Error Handler

```typescript
// lib/errors/handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './AppError';

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

---

## Response Patterns

### Éxito

```typescript
// 200 OK - Get/Update
return NextResponse.json(data);

// 201 Created - Create
return NextResponse.json(data, { status: 201 });

// 204 No Content - Delete
return new NextResponse(null, { status: 204 });
```

### Paginación

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

return NextResponse.json({
  data: users,
  meta: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8,
  },
});
```

---

## Webhooks

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Handle...
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
```

---

## Middleware Pattern

```typescript
// lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export function withAuth(handler: (req: NextRequest, session: Session) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    return handler(request, session);
  };
}

// Uso
export const GET = withAuth(async (request, session) => {
  // session está garantizado
  const users = await getUsers({ createdBy: session.user.id });
  return NextResponse.json(users);
});
```

---

## 🧪 Checklist de Validación

### Server Action Nueva

- [ ] `'use server'` declarado
- [ ] Auth verificado (`await auth()`)
- [ ] Input validado con Zod
- [ ] `revalidatePath` si hay cache
- [ ] Error handling con `AppError`

### API Route Nueva

- [ ] Zod schema para params/body
- [ ] `handleApiError` para catch
- [ ] Status codes correctos (201 create, 204 delete)
- [ ] Headers de rate limit si aplica

### Webhook

- [ ] Signature verification
- [ ] Idempotency key si aplica
- [ ] Logging de eventos

---

## Anti-Patrones

| ❌ Evitar                     | ✅ Preferir                 |
| ----------------------------- | --------------------------- |
| `any` en body/params          | Zod schema validation       |
| Try/catch en cada handler     | handleApiError centralizado |
| Strings mágicos para errores  | ERROR_CODES constantes      |
| Lógica de negocio en route    | Delegar a actions/services  |
| Response sin status explícito | Status codes correctos      |

---

## 🔗 Colaboración

| Con           | Cuándo                           | Acción                                 |
| ------------- | -------------------------------- | -------------------------------------- |
| **db**        | Server Actions con queries       | Cargar `domains/db/SKILL.md`           |
| **security**  | Validación, auth en endpoints    | Cargar `domains/security/SKILL.md`     |
| **architect** | API contracts, webhooks strategy | Cargar `@[.agent/agents/architect.md]` |

---

_Skill de dominio del TimeKast Factory_
