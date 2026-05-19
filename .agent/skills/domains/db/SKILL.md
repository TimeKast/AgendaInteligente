---
name: db
description: Drizzle ORM, Neon Postgres, schema definition, queries, migrations
---

# 🗄️ DB Skill

> **Dominio:** Schema, queries, migrations, transacciones.
> **Stack:** Drizzle ORM, Neon Postgres, TypeScript.

---

## Principios Fundamentales

1. **Schema es la fuente de verdad** — `lib/db/schema/*.ts`
2. **Types derivados del schema** — nunca duplicar
3. **Transacciones para operaciones multi-step**
4. **Soft delete por defecto** — `deletedAt` timestamp
5. **UTC siempre** — timezone solo en presentación
6. **Audit fields obligatorios** — trazabilidad en todas las tablas

---

## SIEMPRE / NUNCA

**SIEMPRE:**

1. Usar `...auditFields` helper en todas las tablas
2. Timestamps con `withTimezone: true`
3. Transacciones para múltiples writes relacionados
4. Tipos derivados: `$inferSelect`, `$inferInsert`

**NUNCA:**

1. Hard delete sin soft delete wrapper
2. Timestamps sin timezone
3. N+1 queries sin optimization
4. Raw SQL para operaciones con input de usuario

---

## Estructura de Archivos

```
/lib/db
  /schema
    index.ts          # Re-exports all schemas
    users.ts          # User schema
    [entity].ts       # Other entities
  /helpers
    audit-fields.ts   # Reusable audit field columns
  drizzle.ts          # DB client
  migrations/         # Generated migrations
```

---

## Audit Fields (Obligatorio)

> **Regla:** Todas las tablas DEBEN incluir audit fields para trazabilidad.

### Helper Disponible

```typescript
import { auditFields } from '@/lib/db/helpers/audit-fields';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ... campos de negocio
  ...auditFields, // ← Agrega createdAt, createdBy, modifiedAt, modifiedBy
});
```

### Campos Incluidos

| Campo        | Tipo            | Descripción                  |
| ------------ | --------------- | ---------------------------- |
| `createdAt`  | timestamp (TZ)  | Auto-set al insertar         |
| `createdBy`  | uuid (nullable) | User ID que creó el registro |
| `modifiedAt` | timestamp (TZ)  | Auto-update en cada cambio   |
| `modifiedBy` | uuid (nullable) | User ID que modificó         |

### Uso en Server Actions

```typescript
export async function createOrder(data: FormData) {
  const session = await getSession();

  await db.insert(orders).values({
    ...validated,
    createdBy: session.user.id,
    modifiedBy: session.user.id,
  });
}

export async function updateOrder(id: string, data: FormData) {
  const session = await getSession();

  await db
    .update(orders)
    .set({ ...validated, modifiedBy: session.user.id })
    .where(eq(orders.id, id));
}
```

### Notas

- `createdBy`/`modifiedBy` son nullable para seed data y system operations
- FK constraints a `users.id` deben agregarse vía migration SQL (evita circular imports)

---

## Soft Delete (Opcional)

> Helper disponible para tablas que necesitan soft delete.

### Helper Disponible

```typescript
import { softDeleteFields, notDeleted } from '@/lib/db/helpers/soft-delete';

// En schema
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...softDeleteFields, // ← Agrega deletedAt, deletedBy
});

// En queries
const active = await db.select().from(orders).where(notDeleted(orders));

// Para soft delete
await db
  .update(orders)
  .set({
    deletedAt: new Date(),
    deletedBy: session.user.id,
  })
  .where(eq(orders.id, id));
```

### Campos Incluidos

| Campo       | Tipo            | Descripción    |
| ----------- | --------------- | -------------- |
| `deletedAt` | timestamp (TZ)  | Null = activo  |
| `deletedBy` | uuid (nullable) | Quién lo borró |

---

## Dual ID Pattern (Opcional)

> Para tablas que necesitan IDs visibles al usuario.

### Schema Pattern

```typescript
export const orders = pgTable('orders', {
  // Technical ID (PK, joins, indexes)
  id: uuid('id').primaryKey().defaultRandom(),

  // Human ID (display, URLs, breadcrumbs)
  orderNumber: text('order_number').notNull().unique(),
});
```

### Helper Disponible

```typescript
import { generateHumanId } from '@/lib/utils/human-id';

generateHumanId(42, { prefix: 'ORD' }); // → 'ORD-2026-0042'
```

### Cuándo Usar

- ✅ Orders, Invoices, Tickets — usuarios referencian
- ✅ Users — si aparece en reportes
- ❌ Settings, Audit Logs — solo uso interno

### ⚠️ Limitación

El helper es **application-level only**. El sequence se calcula desde app.
Para alta concurrencia, implementar DB sequences.

---

## Definición de Schema

### Tabla Básica (con Audit Fields)

```typescript
// lib/db/schema/users.ts
import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { auditFields } from '../helpers/audit-fields';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...auditFields, // ← createdAt, createdBy, modifiedAt, modifiedBy
});

// Tipos derivados
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Schemas Zod (para validación)
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
```

### Relaciones

```typescript
// lib/db/schema/posts.ts
import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { auditFields } from '../helpers/audit-fields';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...auditFields,
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
```

### Enums

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);

export const users = pgTable('users', {
  // ...
  role: userRoleEnum('role').notNull().default('user'),
});
```

---

## Queries

### Select Básico

```typescript
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// Todos los usuarios activos
const activeUsers = await db
  .select()
  .from(users)
  .where(and(eq(users.isActive, true), isNull(users.deletedAt)));

// Un usuario por ID
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1)
  .then((rows) => rows[0]);
```

### Select con Relaciones

```typescript
import { db } from '@/lib/db/drizzle';
import { posts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Posts con autor
const postsWithAuthor = await db.query.posts.findMany({
  with: {
    author: true,
  },
  where: eq(posts.authorId, userId),
});
```

### Select con Join Manual

```typescript
const result = await db
  .select({
    postId: posts.id,
    postTitle: posts.title,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id));
```

### Paginación

```typescript
async function getPaginatedUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(isNull(users.deletedAt)),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total: countResult[0].count,
      totalPages: Math.ceil(countResult[0].count / limit),
    },
  };
}
```

---

## Mutations

### Insert

```typescript
const [newUser] = await db
  .insert(users)
  .values({
    email: 'user@example.com',
    name: 'New User',
  })
  .returning();
```

### Update

```typescript
const [updatedUser] = await db
  .update(users)
  .set({ name: 'Updated Name' })
  .where(eq(users.id, userId))
  .returning();
```

### Soft Delete

```typescript
const [deletedUser] = await db
  .update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, userId))
  .returning();
```

### Upsert

```typescript
const [user] = await db
  .insert(users)
  .values({ email, name })
  .onConflictDoUpdate({
    target: users.email,
    set: { name, modifiedAt: new Date() },
  })
  .returning();
```

---

## Transacciones

### Patrón Estándar

```typescript
import { db } from '@/lib/db/drizzle';

async function createPostWithTags(postData: NewPost, tagIds: string[]) {
  return await db.transaction(async (tx) => {
    // Crear post
    const [post] = await tx.insert(posts).values(postData).returning();

    // Crear relaciones con tags
    if (tagIds.length > 0) {
      await tx.insert(postTags).values(
        tagIds.map((tagId) => ({
          postId: post.id,
          tagId,
        }))
      );
    }

    // Actualizar contador del autor
    await tx
      .update(users)
      .set({ postCount: sql`${users.postCount} + 1` })
      .where(eq(users.id, postData.authorId));

    return post;
  });
}
```

### Con Rollback Explícito

```typescript
await db.transaction(async (tx) => {
  const [order] = await tx.insert(orders).values(orderData).returning();

  const paymentResult = await processPayment(order);

  if (!paymentResult.success) {
    tx.rollback();
    throw new AppError(ERROR_CODES.PAYMENT_FAILED);
  }

  await tx.update(orders).set({ paymentId: paymentResult.id }).where(eq(orders.id, order.id));

  return order;
});
```

---

## Migrations

### Comandos

```bash
# Generar migration desde cambios en schema
pnpm db:generate

# Aplicar migrations pendientes
pnpm db:migrate

# Ver estado de migrations
pnpm db:status

# Abrir Drizzle Studio
pnpm db:studio
```

### Workflow

1. Modificar schema en `lib/db/schema/*.ts`
2. `pnpm db:generate` — genera migration
3. Revisar SQL generado en `lib/db/migrations/`
4. `pnpm db:migrate` — aplicar en desarrollo
5. Commit de schema + migration
6. CI aplica en staging/prod

---

## Índices y Performance

### Crear Índices

```typescript
import { index } from 'drizzle-orm/pg-core';

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    authorIdx: index('posts_author_idx').on(table.authorId),
    statusCreatedIdx: index('posts_status_created_idx').on(table.status, table.createdAt),
  })
);
```

### Evitar N+1

```typescript
// ❌ N+1 Query
const posts = await db.select().from(posts);
for (const post of posts) {
  const author = await db.select().from(users).where(eq(users.id, post.authorId));
}

// ✅ Single Query con Join
const postsWithAuthors = await db.query.posts.findMany({
  with: { author: true },
});
```

---

## Patrones Especiales

### Snapshot Fields (Inmutabilidad)

```typescript
// Para datos que NO deben cambiar después de creación
export const picks = pgTable('picks', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull(),
  teamId: uuid('team_id').notNull(),
  // Snapshot del spread al momento del pick - INMUTABLE
  lineAtPick: decimal('line_at_pick', { precision: 4, scale: 1 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### Timestamps UTC

```typescript
// Siempre usar withTimezone: true
createdAt: timestamp('created_at', { withTimezone: true })
  .notNull()
  .defaultNow(),
```

---

## 🧪 Checklist de Validación

### Schema Nuevo

- [ ] Usa `...auditFields` helper
- [ ] Timestamps con `withTimezone: true`
- [ ] Soft delete si aplica (`...softDeleteFields`)
- [ ] Índices para queries comunes
- [ ] Tipos derivados: `$inferSelect`, `$inferInsert`
- [ ] FK con `onDelete` definido

### Query Nueva

- [ ] No hay N+1 (usa joins o `with`)
- [ ] Transacciones si múltiples writes
- [ ] `modifiedBy` en updates

### Migration

- [ ] Generada con `pnpm db:generate`
- [ ] SQL revisado antes de aplicar
- [ ] Rollback considerado

---

## Anti-Patrones

| ❌ Evitar                      | ✅ Preferir                                 |
| ------------------------------ | ------------------------------------------- |
| Tipos manuales                 | `$inferSelect`, `$inferInsert`              |
| Hard delete                    | Soft delete con `deletedAt`                 |
| Múltiples queries dependientes | `db.transaction()`                          |
| N+1 queries                    | Joins o `with` relations                    |
| Timestamps sin timezone        | `withTimezone: true`                        |
| SQL raw para todo              | Query builder de Drizzle                    |
| Campos manuales de auditoría   | `...auditFields` helper                     |
| `updatedAt` (legacy)           | `modifiedAt` (consistente con `modifiedBy`) |

---

## 🔗 Colaboración

| Con           | Cuándo                                    | Acción                                 |
| ------------- | ----------------------------------------- | -------------------------------------- |
| **architect** | Schema changes >3 tablas, patrones nuevos | Cargar `@[.agent/agents/architect.md]` |
| **security**  | Row-level security, permisos de datos     | Cargar `domains/security/SKILL.md`     |
| **api**       | Server Actions con DB                     | Coordinar                              |
| **testing**   | Tests de integración con DB               | Cargar `domains/testing/SKILL.md`      |

---

_Skill de dominio del TimeKast Factory_
