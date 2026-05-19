---
name: database-design
description: Database design principles and decision-making. Schema design, indexing strategy, ORM selection, serverless databases.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Database Design

> **Learn to THINK, not copy SQL patterns.**

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

| File                    | Description                           | When to Read       |
| ----------------------- | ------------------------------------- | ------------------ |
| `database-selection.md` | PostgreSQL vs Neon vs Turso vs SQLite | Choosing database  |
| `orm-selection.md`      | Drizzle vs Prisma vs Kysely           | Choosing ORM       |
| `schema-design.md`      | Normalization, PKs, relationships     | Designing schema   |
| `indexing.md`           | Index types, composite indexes        | Performance tuning |
| `optimization.md`       | N+1, EXPLAIN ANALYZE                  | Query optimization |
| `migrations.md`         | Safe migrations, serverless DBs       | Schema changes     |

### Large Table Patterns (SK Reference)

For tables with >10K rows, consult the SK documentation:

- **Server-side pagination:** `docs/reference/crud-scaffold.md` → Layer 13
- **Cached counts:** `src/lib/db/utils/pagination.ts` → `createCachedCount()`
- **pg_trgm search indexes:** `docs/reference/crud-scaffold.md` → Layer 13 § Search Index Pattern
- **Decision matrix (client vs server):** `docs/reference/crud-scaffold.md` → Layer 13 § Decision Matrix

---

## ⚠️ Core Principle

- ASK user for database preferences when unclear
- Choose database/ORM based on CONTEXT
- Don't default to PostgreSQL for everything

---

## Decision Checklist

Before designing schema:

- [ ] Asked user about database preference?
- [ ] Chosen database for THIS context?
- [ ] Considered deployment environment?
- [ ] Planned index strategy?
- [ ] Defined relationship types?
- [ ] Assessed table volume? (→ server-side pagination if >1K rows)

---

## Anti-Patterns

❌ Default to PostgreSQL for simple apps (SQLite may suffice)
❌ Skip indexing
❌ Use SELECT \* in production
❌ Store JSON when structured data is better
❌ Ignore N+1 queries
❌ Use `ILIKE '%text%'` without pg_trgm on tables >50K rows
❌ Run uncached `COUNT(*)` on tables >100K rows
❌ Use 12h cache TTL on realtime tables (only for batch/cron-updated tables)
