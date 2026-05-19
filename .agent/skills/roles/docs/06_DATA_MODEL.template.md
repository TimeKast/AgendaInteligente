# 🗄️ Modelo de Datos - {{PROJECT_NAME}}

> **⚠️ FUENTE DE VERDAD:** Este documento define el schema.
> El código en `/lib/db/schema/` debe coincidir exactamente.

> **Generado desde:** Script Canónico §4 (Modelo de Datos)

---

## Diagrama ER

```mermaid
erDiagram
    User ||--o{ {{Entity1}} : creates
    User }o--o{ {{Entity2}} : participates
    {{Entity1}} ||--|{ {{Entity3}} : contains
    {{Entity3}} ||--|{ {{Entity4}} : has
```

---

## Entidades

### users

**Descripción:** Usuarios del sistema

| Campo       | Tipo         | Nullable | Default             | Descripción                 |
| ----------- | ------------ | -------- | ------------------- | --------------------------- |
| id          | uuid         | ❌       | `gen_random_uuid()` | PK                          |
| email       | varchar(255) | ❌       | -                   | Email único                 |
| name        | varchar(100) | ❌       | -                   | Nombre display              |
| image       | text         | ✅       | null                | Avatar URL                  |
| role        | user_role    | ❌       | `'user'`            | Rol del usuario             |
| created_at  | timestamptz  | ❌       | `now()`             | Fecha creación              |
| created_by  | uuid         | ✅       | null                | FK a users (quién creó)     |
| modified_at | timestamptz  | ❌       | `now()`             | Última modificación         |
| modified_by | uuid         | ✅       | null                | FK a users (quién modificó) |

**Índices:**

- `users_pkey` PRIMARY KEY (id)
- `users_email_unique` UNIQUE (email)

**Relaciones:**

- hasMany: {{Entity1}}
- belongsToMany: {{Entity2}}

---

### {{entity_name}}

**Descripción:** {{Descripción de la entidad}}

| Campo       | Tipo          | Nullable  | Default             | Descripción     |
| ----------- | ------------- | --------- | ------------------- | --------------- |
| id          | uuid          | ❌        | `gen_random_uuid()` | PK              |
| {{campo_1}} | {{tipo}}      | {{✅/❌}} | {{default}}         | {{descripción}} |
| {{campo_2}} | {{tipo}}      | {{✅/❌}} | {{default}}         | {{descripción}} |
| user_id     | uuid          | ❌        | -                   | FK a users      |
| status      | {{enum_name}} | ❌        | `'draft'`           | Estado actual   |
| created_at  | timestamptz   | ❌        | `now()`             | -               |
| modified_at | timestamptz   | ❌        | `now()`             | -               |

**Índices:**

- `{{entity}}_pkey` PRIMARY KEY (id)
- `{{entity}}_user_id_idx` (user_id)
- `{{entity}}_status_idx` (status)

**Constraints:**

- `{{entity}}_user_id_fkey` FOREIGN KEY (user_id) REFERENCES users(id)

**Relaciones:**

- belongsTo: User
- hasMany: {{OtraEntidad}}

---

## Enums

### user_role

```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}
```

### {{entity}}\_status

```typescript
enum {{Entity}}Status {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled'
}
```

---

## Campos Especiales

### Snapshots (Inmutables)

> Campos que capturan un valor al momento de creación y **NUNCA** se actualizan.

| Tabla     | Campo                  | Snapshot de | Por qué               |
| --------- | ---------------------- | ----------- | --------------------- |
| {{tabla}} | {{campo}}\_at_creation | {{source}}  | {{razón de fairness}} |

### Cached (Calculados)

> Campos que se recalculan desde otras tablas para performance.

| Tabla | Campo        | Calculado desde         | Trigger                          |
| ----- | ------------ | ----------------------- | -------------------------------- |
| users | total_points | `SUM({{tabla}}.points)` | After INSERT/UPDATE on {{tabla}} |

**Regla:** Cached fields se calculan SIEMPRE desde la fuente, nunca desde otro cached.

---

## Junction Tables (Many-to-Many)

### {{entity1}}\_{{entity2}}

**Descripción:** Relación N:M entre {{Entity1}} y {{Entity2}}

| Campo           | Tipo        | Nullable | Default | Descripción |
| --------------- | ----------- | -------- | ------- | ----------- |
| {{entity1}}\_id | uuid        | ❌       | -       | FK          |
| {{entity2}}\_id | uuid        | ❌       | -       | FK          |
| created_at      | timestamptz | ❌       | `now()` | -           |

**Índices:**

- PRIMARY KEY ({{entity1}}\_id, {{entity2}}\_id)

---

## Soft Delete

> Entidades que usan soft delete en lugar de DELETE físico.

| Tabla     | Campo      | Valor cuando eliminado |
| --------- | ---------- | ---------------------- |
| {{tabla}} | deleted_at | timestamp              |
| {{tabla}} | is_active  | false                  |

**Queries deben filtrar:** `WHERE deleted_at IS NULL`

---

## Timestamps y Audit Fields

Todas las tablas incluyen audit fields via helper:

```typescript
import { auditFields } from '@/lib/db/helpers/audit-fields';

export const myTable = pgTable('my_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ... campos de negocio
  ...auditFields, // ← createdAt, createdBy, modifiedAt, modifiedBy
});
```

| Campo       | Tipo        | Auto-update      | Descripción         |
| ----------- | ----------- | ---------------- | ------------------- |
| created_at  | timestamptz | No (solo insert) | Cuándo se creó      |
| created_by  | uuid        | No               | Quién lo creó       |
| modified_at | timestamptz | Sí ($onUpdate)   | Última modificación |
| modified_by | uuid        | Manual           | Quién lo modificó   |

---

## Drizzle Schema Reference

```typescript
// lib/db/schema/users.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { auditFields } from '../helpers/audit-fields';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...auditFields, // ← createdAt, createdBy, modifiedAt, modifiedBy
});
```

---

## Migraciones

Ver `/lib/db/migrations/` para historial de cambios al schema.

**Convención de nombres:**

```
YYYYMMDD_HHMMSS_descripcion_corta.sql
```

---

_Generado con TimeKast Factory_
