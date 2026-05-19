---
name: kb-db
description: Portable Drizzle ORM + Postgres patterns — schema as SSOT with `$inferSelect`/`$inferInsert`, relations, queries, mutations with `onConflictDoUpdate`/`returning`, transactions, index selection (B-tree/GIN/GiST/HNSW), composite column ordering, `EXPLAIN ANALYZE` before optimizing, N+1 avoidance. Invoke for Drizzle work agnostic to kit helpers. For kit primitives (`auditFields`, `getNextHumanId`, pagination utils) → `sk-db`.
last-verified: 2026-04-23
---

# kb-db — Portable Drizzle ORM + Postgres Patterns

> Stack: Drizzle ORM (`^0.45`) + Postgres (Neon / self-hosted / any).
> **Portable** — these patterns work in any Drizzle project, with or without the Starter Kit.
>
> **Pair:** [`sk-db`](../sk-db/SKILL.md) — for kit-shipped primitives (`auditFields`, `softDeleteFields`, dual-ID with `getNextHumanId`, pagination utilities, `canHardDeleteUser`, migration scripts, `pnpm db:query` runner). For Server Actions → [`kb-api`](../kb-api/SKILL.md) / [`sk-api`](../sk-api/SKILL.md). For tests → [`kb-testing-nextjs`](../kb-testing-nextjs/SKILL.md). For SQL injection prevention → [`kb-security`](../kb-security/SKILL.md).

---

## 1. Core principles

1. **Schema is the source of truth.** Types, validations, and migrations all derive from the Drizzle schema — never duplicate.
2. **Types derived, never hand-written** — `$inferSelect` / `$inferInsert`.
3. **Transactions for multi-step writes** — all-or-nothing.
4. **Soft delete whenever the record has downstream references** — hard delete only for orphans.
5. **UTC everywhere** — `withTimezone: true`. Display TZ only at the UI edge.
6. **Always parameterize** — Drizzle query builder binds parameters. Never string-interpolate user input into SQL.

---

## 2. Schema — canonical shape

```ts
import { pgTable, text, integer, uuid, timestamp } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status').notNull().default('pending'),
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
```

> Timestamps ALWAYS with `withTimezone: true`. Postgres stores them in UTC; rendering in the user's zone happens at the UI boundary (Server Component / date formatter), never in the DB layer.

### Naming & layout conventions (portable)

| Layer                | Convention                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **DB column names**  | `snake_case` — `created_at`, `author_id`, `total_cents`. Postgres norm; avoids quoted identifiers.                        |
| **TS property keys** | `camelCase` — `createdAt`, `authorId`, `totalCents`. Drizzle maps TS ↔ SQL automatically.                                 |
| **Table names**      | `snake_case`, plural — `orders`, `post_tags`, `invite_tokens`.                                                            |
| **Enum names**       | `snake_case` singular with `_enum` suffix in the PG name — `pgEnum('user_role', [...])`.                                  |
| **Schema files**     | One file per **domain** (bounded context), not per table. `schema/orders.ts` may own `orders`, `order_items`, `payments`. |
| **Enums central**    | Enums shared across domains live in a dedicated `schema/enums.ts`. Re-exported from `schema/index.ts`.                    |
| **Barrel**           | `schema/index.ts` re-exports everything so callers import from a single entry point.                                      |

```
schema/
├── index.ts         ← re-exports every table, enum, relation
├── enums.ts         ← shared pgEnums
├── users.ts         ← users, accounts, sessions
├── orders.ts        ← orders, order_items, payments
└── posts.ts         ← posts, post_tags, tags
```

> ❌ Don't put unrelated domains in one file (e.g. `users` + `orders` + `posts`). Splitting is cheap; merging later is not.
> ❌ Don't hand-write table interfaces in TS. Drizzle infers them; drift is guaranteed if you duplicate.

### Relations

```ts
import { relations } from 'drizzle-orm';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
```

### Enums

```ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);
```

---

## 3. Queries

### Filtered select

```ts
import { and, eq, isNull } from 'drizzle-orm';

const activeUsers = await db
  .select()
  .from(users)
  .where(and(eq(users.isActive, true), isNull(users.deletedAt)));
```

### Relation query

```ts
const postsWithAuthor = await db.query.posts.findMany({
  with: { author: true },
  where: eq(posts.authorId, userId),
});
```

### Manual join (picking columns)

```ts
const rows = await db
  .select({
    postId: posts.id,
    postTitle: posts.title,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id));
```

---

## 4. Mutations

```ts
// Insert with returning
const [row] = await db.insert(users).values({ email, name }).returning();

// Update with returning
const [row] = await db.update(users).set({ name }).where(eq(users.id, id)).returning();

// Upsert
const [row] = await db
  .insert(users)
  .values({ email, name })
  .onConflictDoUpdate({
    target: users.email,
    set: { name, modifiedAt: new Date() },
  })
  .returning();
```

---

## 5. Transactions

All-or-nothing for multi-step writes:

```ts
await db.transaction(async (tx) => {
  const [post] = await tx.insert(posts).values(postData).returning();

  if (tagIds.length > 0) {
    await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId: post.id, tagId })));
  }

  await tx
    .update(users)
    .set({ postCount: sql`${users.postCount} + 1` })
    .where(eq(users.id, postData.authorId));

  return post;
});
```

Explicit rollback on business failure:

```ts
await db.transaction(async (tx) => {
  const [order] = await tx.insert(orders).values(orderData).returning();
  const payment = await processPayment(order);

  if (!payment.success) {
    tx.rollback();
    throw new Error('Payment failed');
  }

  await tx.update(orders).set({ paymentId: payment.id }).where(eq(orders.id, order.id));
});
```

---

## 6. Indexes — when and how

### When to create an index

| Index these                          | Don't over-index                        |
| ------------------------------------ | --------------------------------------- |
| Columns used in `where` clauses      | Write-heavy tables (slower inserts)     |
| Columns used in `join` conditions    | Low-cardinality columns (e.g., boolean) |
| Columns used in `order by`           | Columns rarely queried                  |
| Foreign key columns                  | —                                       |
| Columns backing `unique` constraints | —                                       |

### Index type selection (Postgres)

| Type               | Use for                                   | Drizzle default  |
| ------------------ | ----------------------------------------- | ---------------- |
| **B-tree**         | General purpose — equality & range        | ✅ `index()`     |
| **Hash**           | Equality only (rarely worth it vs B-tree) | —                |
| **GIN**            | `jsonb`, arrays, full-text (`tsvector`)   | `.using('gin')`  |
| **GiST**           | Geometric, range types, fuzzy match       | `.using('gist')` |
| **HNSW / IVFFlat** | Vector similarity (`pgvector`)            | `.using('hnsw')` |

### Composite index — column order

Order of columns in a composite index matters:

1. **Equality columns first** — columns matched with `=`
2. **Range columns last** — columns matched with `<`, `>`, `between`, `order by`
3. **Most selective first** within equality — column that narrows results most
4. **Match query pattern** — index exists to serve a specific query shape

```ts
// Query: WHERE status = 'published' AND created_at > '2026-01-01' ORDER BY created_at DESC
// status is equality (very selective), created_at is range → (status, created_at) ✅
statusCreatedIdx: index('posts_status_created_idx').on(t.status, t.createdAt),
```

### Declaring indexes

```ts
import { index } from 'drizzle-orm/pg-core';

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id').notNull(),
    status: text('status').notNull(),
    tags: jsonb('tags'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    authorIdx: index('posts_author_idx').on(t.authorId),
    statusCreatedIdx: index('posts_status_created_idx').on(t.status, t.createdAt),
    tagsIdx: index('posts_tags_idx').using('gin', t.tags),
  })
);
```

---

## 7. Diagnose before optimizing — `EXPLAIN ANALYZE`

Before adding an index or rewriting a query, measure:

```sql
EXPLAIN ANALYZE
SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 20;
```

What to look for:

| Signal                            | Meaning                                               |
| --------------------------------- | ----------------------------------------------------- |
| `Seq Scan` on a large table       | Missing index — Postgres is reading every row         |
| `rows=` actual ≫ estimated        | Stats are stale (`ANALYZE`) or index not selective    |
| `Sort Method: external merge`     | `work_mem` too small for the `order by` / sort spills |
| `Nested Loop` with high row count | Probable N+1 / missing join index                     |
| `Index Scan` / `Index Only Scan`  | ✅ the index is being used                            |

**Optimization priority (apply in order):**

1. Add the missing index (fixes 80% of slow queries in this stack).
2. Select only the columns you need — avoid `select *` on wide tables.
3. Paginate at the DB, not in memory (`limit` + `offset`, or keyset).
4. Prefer joins over subqueries when the planner lets you.
5. Cache at the edge (`unstable_cache` / `revalidateTag`) only after the query is as fast as it can be.

> 🛑 **Never pre-optimize without `EXPLAIN ANALYZE`.** Guessing at indexes on a real table is how you end up with 12 unused indexes that slow every write.

### Avoid N+1

```ts
// ❌ N+1 — one query per post
const list = await db.select().from(posts);
for (const p of list) {
  const author = await db.select().from(users).where(eq(users.id, p.authorId));
}

// ✅ single query with relation
const list = await db.query.posts.findMany({ with: { author: true } });
```

---

## 8. Special patterns

### Snapshot columns (immutability)

For data that must not change after creation (e.g., the line at pick time, the price at checkout):

```ts
export const picks = pgTable('picks', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull(),
  teamId: uuid('team_id').notNull(),
  lineAtPick: decimal('line_at_pick', { precision: 4, scale: 1 }).notNull(), // immutable
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

Never update snapshot columns — freeze the value at insert. Enforce at the application layer (no update path references them).

### Timestamps — always with timezone

```ts
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
```

Never use plain `timestamp` without timezone. Postgres treats them as local-time-unknown, leading to off-by-hours bugs at DST transitions.

### Audit-columns pattern (portable)

Most business tables benefit from a consistent **who did what, when** footprint. The portable shape is four columns repeated across domain tables:

| Column        | Type                            | Purpose                   |
| ------------- | ------------------------------- | ------------------------- |
| `created_at`  | `timestamptz NOT NULL`          | When the row was inserted |
| `created_by`  | `uuid` (FK → users, `SET NULL`) | Who inserted it           |
| `modified_at` | `timestamptz NOT NULL`          | When it was last updated  |
| `modified_by` | `uuid` (FK → users, `SET NULL`) | Who last updated it       |

Conceptual shape:

```ts
// Portable pattern — each domain file repeats these four columns.
// (The kit factors them into a helper; see sk-db. Without the kit, you inline them.)
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ... business columns ...
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  modifiedAt: timestamp('modified_at', { withTimezone: true }).notNull().defaultNow(),
  modifiedBy: uuid('modified_by').references(() => users.id, { onDelete: 'set null' }),
});
```

Rules:

- `modified_at` must be updated on every `UPDATE` — the application writes it (`.set({ modifiedAt: new Date(), ... })`); don't rely on DB triggers unless you audit them.
- `created_by` / `modified_by` use `ON DELETE SET NULL` — deleting a user should not cascade-wipe their history.
- These columns are **audit**, not **authorization** — never gate access on them; gate on RBAC.

### Soft delete pattern (portable)

For records with downstream references (orders, users with history, posts with comments), delete logically, not physically:

```ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ...
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // nullable — null = active
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
});
```

Query conventions:

```ts
import { and, eq, isNull } from 'drizzle-orm';

// Default read — active rows only. ALWAYS filter deletedAt.
const activeUsers = await db.select().from(users).where(isNull(users.deletedAt));

// Admin view — include soft-deleted
const allUsers = await db.select().from(users); // no filter — explicit choice

// Combined with business filter
await db
  .select()
  .from(posts)
  .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt)));
```

Rules:

- **Every read of a soft-deletable table defaults to `isNull(deletedAt)`.** Omitting the filter is a bug.
- Soft delete is **application-level** — Postgres does not know about it. Partial unique indexes on `(email) WHERE deleted_at IS NULL` may be needed when re-registration is allowed.
- Index `deleted_at IS NULL` if most reads filter on it on a hot table.
- Hard delete is only safe for **orphan** tables (logs, sessions, tokens with no inbound FKs).

### Dual-ID modeling (portable)

When an entity needs both **stable internal identity** and a **human-readable display code**, use two columns:

| Column     | Type                      | Audience                                          |
| ---------- | ------------------------- | ------------------------------------------------- |
| `id`       | `uuid` primary key        | Internal — FKs, joins, APIs                       |
| `human_id` | `text` / `varchar` unique | External — invoices, tickets, URLs the user reads |

```ts
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  humanId: text('human_id').notNull().unique(), // e.g. "INV-2026-0042"
  // ...
});
```

Rules:

- **Never FK against `human_id`.** Joins, relations, and internal references always use `id` (uuid) — stable, random, non-enumerable.
- **Never expose the uuid in user-facing contexts** (emails, PDFs, spoken support). Use `human_id`.
- `human_id` generation must be **atomic** and **concurrency-safe** — typically a Postgres `SEQUENCE` feeding a formatter (prefix + year + zero-padded counter). The naive `count(*) + 1` pattern races under concurrency AND breaks under deletes (a hole in the middle re-collides on the highest live id). If you cannot ship a SEQUENCE, the only safe app-level fallback is `MAX(trailing-int) + 1` paired with a 23505-retry wrapper — never `count(*)`.
- Format `human_id` deterministically. Clients will parse it; don't change the shape once live.

### Regex in raw SQL — POSIX char classes only (Drizzle ``sql`...` `` gotcha)

> 🔴 Silent-failure mode that has shipped to production in real projects. If you ever embed a regex literal inside a Drizzle ``sql`...` `` template tag, this rule is non-negotiable.

JS template literals expose the strings array in two forms:

| Form          | What it contains for `` `\d+` ``     | Who reads it        |
| ------------- | ------------------------------------ | ------------------- |
| `strings`     | `"d+"` (cooked — JS strips the `\`)  | Drizzle's `sql` tag |
| `strings.raw` | `"\\d+"` (raw — backslash preserved) | `String.raw\`...\`` |

Drizzle's ``sql`...` `` tag reads the **cooked** form. So:

```ts
// ❌ BROKEN — Postgres receives '(d+)$' (literal "d", one or more), never matches "ORD-2026-0042"
const expr = sql`SUBSTRING(${col} FROM '(\d+)$')`;

// ✅ CORRECT — POSIX char class, no backslash escapes
const expr = sql`SUBSTRING(${col} FROM '([0-9]+)$')`;
```

Failure shape: `MAX(SUBSTRING(...))` returns `NULL` for every row → the caller silently always gets the same default value (often `0` or `1`) → permanent collisions on humanId-style sequences. **No runtime error**, just wrong data.

**Rule (mandatory whenever a regex literal lives inside ``sql`...` ``):**

```
❌ PROHIBIDO: \d   \w   \s   \D   \W   \S   \b   (any backslash escape)
✅ OBLIGATORIO: POSIX char classes literales: [0-9]  [A-Za-z]  [[:alnum:]]  [[:space:]]  [[:digit:]]
```

POSIX char classes are escape-free, equivalent in expressiveness for the common cases, and identical in behavior to the backslash escapes you would have written in non-cooked contexts.

**Other Drizzle places where this bites:**

- Any ``sql`SELECT regexp_match(...)` ``
- ``sql`SELECT REGEXP_REPLACE(col, '\d', '')` `` — same trap
- Custom `WHERE col SIMILAR TO '\d+'` — same trap
- `sql.raw(string)` is also cooked-equivalent if the string was assembled from a template literal

**Test strategy.** Pin the literal in your unit test by inspecting the SQL object's serialized form:

```ts
const expr = sql<number>`COALESCE(MAX(CAST(SUBSTRING(${col} FROM '([0-9]+)$') AS integer)), 0)::int`;
const serialized = JSON.stringify(expr);
expect(serialized).toContain('[0-9]+');
expect(serialized).not.toContain('(d+)$'); // the bug pattern
```

> If you legitimately need a backslash in raw SQL, build the string outside the tag and pass it as a parameter (Drizzle binds it normally, no cooking) — never inline it into the template.

### Pagination patterns (portable)

Two viable approaches in Postgres. Pick by access pattern, not by habit:

| Pattern             | When to use                                                                                | When NOT                                            |
| ------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **Offset / limit**  | Small result sets (< 10K rows), admin tables with page numbers, acceptable `COUNT(*)` cost | Deep pagination (page 500) — `OFFSET` reads & skips |
| **Cursor / keyset** | Large lists, infinite scroll, feeds, event logs, append-mostly data                        | When the user needs to jump to arbitrary page N     |

**Offset (simple, stable page numbers):**

```ts
const PAGE_SIZE = 20;
const rows = await db
  .select()
  .from(orders)
  .where(isNull(orders.deletedAt))
  .orderBy(desc(orders.createdAt))
  .limit(PAGE_SIZE)
  .offset((page - 1) * PAGE_SIZE);

// Separately — COUNT(*) for total pages. Cache it (TTL or tag-based) on hot tables.
```

**Cursor / keyset (fast at any depth):**

```ts
import { and, lt, desc } from 'drizzle-orm';

// cursor = { createdAt, id } from the last row of the previous page
const rows = await db
  .select()
  .from(orders)
  .where(
    and(
      isNull(orders.deletedAt),
      // tie-breaker by id handles identical timestamps
      or(
        lt(orders.createdAt, cursor.createdAt),
        and(eq(orders.createdAt, cursor.createdAt), lt(orders.id, cursor.id))
      )
    )
  )
  .orderBy(desc(orders.createdAt), desc(orders.id))
  .limit(PAGE_SIZE);
```

Rules:

- **Always sort by an indexed, deterministic column.** `createdAt` alone is not deterministic (collisions) — add `id` as tie-breaker.
- **Validate & cap `limit`** at the API boundary. `limit: req.query.limit` unbounded is a DoS vector.
- **Don't count unless you display the count.** `COUNT(*)` on a wide table is expensive; many UIs only need "has next page" (fetch `limit + 1`, discard the extra).
- **Offset + soft delete** interact — the `deleted_at` filter must be part of the same query producing the count, or totals will drift.

---

## 9. Portable anti-patterns

| ❌                                                                     | ✅                                                                      |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Hand-written types (`interface User { ... }`)                          | `$inferSelect` / `$inferInsert`                                         |
| Hard delete on referenced tables                                       | Soft delete + `isNull(deletedAt)`                                       |
| Reading a soft-deletable table without `isNull(deletedAt)`             | Every default read filters `deletedAt`                                  |
| Multiple dependent writes as separate statements                       | `db.transaction()`                                                      |
| N+1 loops                                                              | `with: { relation: true }` or join                                      |
| Timestamps without timezone                                            | `withTimezone: true`                                                    |
| Raw SQL with string-interpolated user input                            | Drizzle query builder (parameter binding)                               |
| Writes to schema via ad-hoc scripts / `db:push` in production          | `db:generate` → `db:migrate` (reviewed, versioned)                      |
| Indexes without `EXPLAIN ANALYZE`                                      | Measure first, index with evidence                                      |
| `select *` on wide tables                                              | Pick explicit columns                                                   |
| In-memory pagination after fetching all                                | DB-level `limit` + `offset` or keyset                                   |
| Offset pagination without validated / capped `limit`                   | Validate + clamp `limit` at the API boundary                            |
| Sorting by non-unique column only (e.g. `createdAt`)                   | Add `id` as tie-breaker for deterministic order                         |
| FKs pointing at `human_id` instead of `id` (uuid)                      | FKs always target the uuid; `human_id` is display-only                  |
| Generating `human_id` by `count(*) + 1` (races + breaks under deletes) | Postgres `SEQUENCE`, or app-level `MAX(trailing-int) + 1` + 23505-retry |
| `\d` / `\w` / `\s` inside `` sql`...` `` (cooked → silently broken)    | POSIX char classes literales (`[0-9]`, `[A-Za-z]`, `[[:alnum:]]`)       |
| Unrelated domains in one `schema/everything.ts`                        | One file per domain + `schema/index.ts` barrel                          |
| Mutable snapshot columns                                               | Freeze at insert, never update                                          |

---

## 10. Portable checklist

**New schema:**

- [ ] Table / column names in `snake_case`; TS properties in `camelCase`
- [ ] One file per domain; shared enums in `schema/enums.ts`; re-exported from `schema/index.ts`
- [ ] Timestamps with `withTimezone: true`
- [ ] `$inferSelect` + `$inferInsert` exported
- [ ] FK with explicit `onDelete`
- [ ] If auditable: `created_at` / `created_by` / `modified_at` / `modified_by` present (FK `ON DELETE SET NULL`)
- [ ] If soft-deletable: nullable `deleted_at` (+ optional `deleted_by`) present; reads filter `isNull(deletedAt)`
- [ ] If user-facing display code: separate `id` (uuid, internal) and `human_id` (unique, display); FKs reference `id`, never `human_id`
- [ ] `human_id` fed by a Postgres `SEQUENCE`, not app-level max + 1
- [ ] Indexes declared for common `where` / `order by` patterns (including `deleted_at IS NULL` on hot tables)
- [ ] Schema change lands via `db:generate` → `db:migrate` (reviewed migration file), not `db:push` in production

**New query:**

- [ ] No N+1 (join or `with`)
- [ ] Transaction if >1 dependent write
- [ ] Uses query builder (parameterized) — never raw-SQL interpolation

**Performance tuning:**

- [ ] Ran `EXPLAIN ANALYZE` before adding an index
- [ ] Verified the new index is used (`Index Scan` in the plan)
- [ ] Composite index column order: equality → range, most selective first

---

_Cross-reference: [`sk-db`](../sk-db/SKILL.md) — kit-shipped helpers (`auditFields`, `softDeleteFields`, `canHardDeleteUser`, pagination, `pnpm db:query`). [`sk-features-index`](../sk-features-index/SKILL.md) — feature catalog. [`kb-api`](../kb-api/SKILL.md) / [`sk-api`](../sk-api/SKILL.md) — Server Actions consuming the DB. [`kb-testing-nextjs`](../kb-testing-nextjs/SKILL.md) — integration tests. [`kb-security`](../kb-security/SKILL.md) — SQL injection prevention._
