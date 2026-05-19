# SK — Starter Kit Rules

> Reglas del TimeKast Starter Kit. Extiende `CORE.md`.
> Stack: Drizzle ORM + Next.js. Assets: `INVENTORY.md`, `CODEBASE.md`, `HOOKS.md`, pipeline de docs Factory.

---

## 1. Database

#### 1.1 🔴 NUNCA ejecutar db:push sin consentimiento

```
⭐ PREFERIDO: pnpm db:generate → pnpm db:migrate (seguro, reversible)
❌ PROHIBIDO: pnpm db:push sin aprobación
✅ SI es necesario: mostrar --dry-run → ESPERAR confirmación
```

#### 1.2 SSOT Code

```
✅ OBLIGATORIO: src/lib/db/schema/*.ts es la fuente de verdad del modelo de datos
✅ OBLIGATORIO: Validaciones Zod derivan del schema, nunca al revés
✅ OBLIGATORIO: One-file-per-domain + enums centralizados — detalle en sk-db §1
```

#### 1.3 🔴 SIEMPRE usar `pnpm db:query` para polling/inspección de DB

```
❌ PROHIBIDO: Scripts ad-hoc con dotenv/require/tsx + @neondatabase/serverless para consultar la DB
❌ PROHIBIDO: Inventar marometas para cargar .env.local / DATABASE_URL en one-shots
✅ OBLIGATORIO: pnpm db:query "SELECT ..."          # read-only, env ya resuelto
✅ OBLIGATORIO: pnpm db:query --tables              # listar tablas
✅ OBLIGATORIO: pnpm db:query --describe <tabla>    # describir schema
✅ OBLIGATORIO: pnpm db:query --json "..."          # output JSON para pipes
ℹ️  El runner bloquea writes (INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/CREATE/GRANT/REVOKE)
ℹ️  Env loading, pool y read-only guard ya resueltos en scripts/tools/db-query.ts
```

**Para writes (migraciones):** usar `pnpm db:generate` + `pnpm db:migrate` (ver §1.1). Nunca un script one-shot.

---

## 2. Code Reuse

#### 2.1 Consultar INVENTORY antes de crear

```
❌ PROHIBIDO: Crear componente/hook/action sin verificar si existe
✅ OBLIGATORIO:
   1. Consultar project/reference/INVENTORY.md (componentes)
   2. Consultar project/reference/HOOKS.md      (hooks / action helpers / DB helpers / form kit / UI wrappers)
   3. Si existe algo similar → reutilizar o extender
   4. Si es nuevo → se agregará en la siguiente regeneración autogen (pre-commit)
ℹ️  Ambos archivos son autogenerados (`pnpm generate:inventory`, `pnpm generate:hooks`)
    y se actualizan en el pre-commit hook — no editar a mano.
```

#### 2.2 File Dependency Awareness

**Antes de modificar CUALQUIER archivo:**

1. Consultar `project/reference/CODEBASE.md` → File Dependencies
2. Identificar archivos dependientes
3. Actualizar TODOS los archivos afectados juntos

#### 2.3 Server Action helpers — `withAuth()` / `withSelf()`

El kit shippea dos wrappers en `src/lib/actions/helpers.ts` que eliminan boilerplate en server actions (auth + validación + revalidación).

```
✅ withAuth()  → actions con RBAC (admin CRUD, gated por resource/action)
✅ withSelf()  → actions self-service (usuario modifica su propia data)
❌ PROHIBIDO: Reescribir auth + zod parsing + revalidatePath a mano
❌ PROHIBIDO: Usar withAuth() para self-service (bypasea el check de RBAC)
```

**Ejemplo mínimo:**

```ts
// Admin — requiere permission check
export const createThing = (input: unknown) =>
  withAuth(
    { resource: 'things', action: 'create', schema, revalidate: '/things' },
    input,
    async (data, userId) => {
      /* ... */
    }
  );

// Self-service — solo auth
export const updateProfile = (formData: FormData) =>
  withSelf({ schema, revalidate: '/profile' }, formData, async (data, userId) => {
    /* ... */
  });
```

> Anti-pattern: invocar `auth()` + `requirePermission()` + `safeParse()` manualmente en cada action. El wrapper existe para eso.

#### 2.4 Path alias `@/`

```
✅ OBLIGATORIO: Imports con `@/` → resolver a `src/` (tsconfig del kit)
❌ PROHIBIDO: Imports relativos con ../../ que crucen más de un nivel
```

---

## 3. UI / Frontend

#### 3.1 Filtros en cascada por defecto (tablas client-side con 2+ filtros)

```
❌ PROHIBIDO: Hardcodear opciones de filtro estáticas cuando hay 2+ filtros
✅ OBLIGATORIO: Cada filtro calcula opciones del subconjunto filtrado por los OTROS
   Solo desactivar si el issue lo especifica EXPLÍCITAMENTE
   Ver `sk-crud-scaffold` § Cascading Filters (o `kb-ui` § Filters)
```

#### 3.2 🔴 Mobile-first 375px baseline + 100% responsive

> Política TimeKast durable — no per-project. La mayoría del tráfico es mobile nativo; diseñar desktop-first y "adaptar" es retrabajo garantizado.

```
✅ OBLIGATORIO: Diseñar desde 375px (iPhone SE baseline) hacia arriba
✅ OBLIGATORIO: Toda pantalla debe ser 100% usable en mobile sin horizontal scroll
✅ OBLIGATORIO: Tailwind breakpoints ASCENDENTES (sm:, md:, lg: encima del base mobile)
❌ PROHIBIDO: Descriptores `max-w-*` sin alternativa mobile
❌ PROHIBIDO: Desktop-only components (tablas con 8+ cols sin variante mobile)
ℹ️  Opt-out permitido SOLO si el issue lo declara explícitamente (ej: admin dashboard desktop-only)
```

#### 3.3 `components/ui/` = shadcn primitives (NO tocar)

```
❌ PROHIBIDO: Editar archivos en src/components/ui/ directamente
❌ PROHIBIDO: Agregar lógica de negocio o variants custom en primitives shadcn
✅ OBLIGATORIO: Componer con primitives, no modificarlas
✅ OBLIGATORIO: Componentes propios viven en src/components/{dominio}/ o src/components/shared/
ℹ️  Si una primitive shadcn no cubre el caso → wrapper en shared/, no fork de ui/
```

---

## 4. QA

#### 4.1 Comandos core

| Herramienta      | Cuándo                                            |
| ---------------- | ------------------------------------------------- |
| `pnpm lint`      | Cada cambio de código                             |
| `pnpm typecheck` | Cada cambio de código                             |
| `pnpm test`      | Después de cambio lógico (Unit + Component)       |
| `pnpm test:e2e`  | Antes de deploy                                   |
| `pnpm verify`    | Pasada combinada (`lint && typecheck && test`)    |
| `pnpm db:query`  | Inspección read-only de DB (ver §1.3 — único way) |

> Utilitarios (`format`, `knip`, `env:check`, `analyze`, etc.) en `package.json` — no son always-on del agente.

#### 4.2 Pirámide de testing (3 capas)

`pnpm test` ejecuta Unit + Component. `pnpm test:e2e` ejecuta E2E.

| Capa          | Runner               | Ubicación                  | Cuándo usar                                                                   |
| ------------- | -------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| **Unit**      | Vitest (node/jsdom)  | `tests/unit/*.test.ts`     | Funciones puras, helpers, validaciones Zod, lógica de dominio sin React       |
| **Component** | Vitest + RTL (jsdom) | `tests/unit/**/*.test.tsx` | Componentes con interacción: render + `userEvent` + assertions sobre DOM real |
| **E2E**       | Playwright           | `tests/e2e/*.spec.ts`      | Flujos completos con app real (auth, RBAC routes, integración DB)             |

```
❌ PROHIBIDO: test shallow (`expect(Component).toBeDefined()`) — no detecta onClick rotos,
              conditional renders, ni bindings de estado
✅ OBLIGATORIO: issue con UI interactiva → component test con RTL
✅ OBLIGATORIO: issue con flujo cross-page o auth → E2E
✅ RTL imports: `@testing-library/react` + `@testing-library/user-event` + matchers de
                `@testing-library/jest-dom/vitest` (cargados vía `vitest.setup.ts`)
```

#### 4.3 Disciplina eslint / TypeScript

El kit es TypeScript-first. Estas reglas aplican a todo proyecto derivado (mismo stack).

```
✅ Unused vars → prefijo `_` (convención eslint estándar: `_unusedArg`)
✅ Consistencia de tipos: preferir `type` para aliases, `interface` para shapes extensibles
❌ PROHIBIDO: `any` sin justificación escrita en comentario adyacente
❌ PROHIBIDO: `// eslint-disable` sin razón específica en la línea siguiente
```

---

## 5. Creación de Issues

```
❌ PROHIBIDO: Crear issues a mano sin el workflow (inconsistencia de formato)
✅ SINGLE ISSUE: /backlog add → el workflow pregunta epic + campos requeridos
✅ BATCH (2+ issues o epic nuevo): /backlog add
✅ PIPELINE (desde docs/design): /backlog (full)
✅ PERMITIDO: Editar issues existentes (marcar Done, agregar Evidence, ajustar AC)
```

> DoR/DoD en `DOR_DOD.md` (always-on) antes de implementar o cerrar.

---

## 6. Project Structure

```
✅ OBLIGATORIO: App code siempre en `src/` (nunca components/ o lib/ sueltos en raíz)
✅ OBLIGATORIO: Shared (ui/, common/, layout/, lib/utils/, config/) NO importa de Domain
✅ OBLIGATORIO: Domain (components/{feature}/, lib/actions/{feature}/, features/{domain}/) SÍ importa Shared
❌ PROHIBIDO: Domain ↔ Domain — extraer a Shared
❌ PROHIBIDO: `types/` dentro de `src/` — vive en raíz (convención TS para `*.d.ts`)
```

> Path alias `@/` → ver §2.4.
> Detalle completo (árbol, tabla de decisión 27 filas, subcarpetas 3+/features 5+, zonas grises) → skill [`sk-project-structure`](../skills/sk-project-structure/SKILL.md).

---

## 7. Deploy / Vercel

#### 7.1 🔴 NUNCA tocar `.env.local` ni linkear projects de Vercel

> Daño real: `vercel link` puede triggerar pull automático que **sobrescribe `.env.local`** del proyecto. Si tenía `DATABASE_URL` o `AUTH_SECRET` custom, se pierden y el user queda locked out. Es destructivo e irreversible (no hay backup automático y `.env.local` está gitignored).

```
❌ PROHIBIDO: vercel link / vercel link --yes / vercel link <project>
❌ PROHIBIDO: vercel pull / vercel env pull (sobrescribe .env.local)
❌ PROHIBIDO: cualquier comando que escriba .env.local sin backup explícito previo
❌ PROHIBIDO: rm / mv / overwrite directo de .env.local, .env.*, .vercel/
✅ OBLIGATORIO: Si el user pide vincular Vercel o pull de env → ESPERAR autorización + hacer `cp .env.local .env.local.bak` ANTES
✅ OBLIGATORIO: Si necesitas verificar env vars → leer .env.local, NUNCA pull
ℹ️  Aplica a Factory + derivados que deployen a Vercel. El daño no es reversible vía git.
```

---

_TimeKast Factory — Starter Kit Rules (L1 Peer)_
