---
trigger: always_on
---

# CORE-SK — Starter Kit Rules

> Reglas para proyectos que usan TimeKast Starter Kit. Extiende CORE.md.
> Estas reglas asumen que el proyecto tiene: Drizzle ORM, Next.js,
> INVENTORY.md, CODEBASE.md, y el pipeline de documentación Factory.

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
✅ OBLIGATORIO: lib/db/schema/*.ts es la fuente de verdad del modelo de datos
✅ OBLIGATORIO: Validaciones Zod derivan del schema, nunca al revés
```

---

## 2. Git / Branching — Adaptive por Fase de Proyecto

> El agente DEBE detectar la fase del proyecto antes de aplicar reglas de branching.

### Detección de fase

```
Leer `version` de package.json:
- "0.0.0"         → Pre-release (main-first)
- "X.Y.Z" (X ≥ 1) → Post-release (develop-first)
```

### Pre-release (v0.0.0)

```
✅ PERMITIDO: Push a main directo (sin ceremony)
✅ PERMITIDO: Trabajar en develop si el developer prefiere
✅ PERMITIDO: Push sin merge ni PR
ℹ️  Vercel: main = preview deployment
ℹ️  No se fuerza ninguna rama — flexibilidad total
```

### Post-release (v1.0.0+)

```
❌ PROHIBIDO: Merge o push a main sin autorización explícita del usuario
✅ OBLIGATORIO: develop es la rama de trabajo
✅ OBLIGATORIO: Mostrar qué se mergea → ESPERAR autorización → Ejecutar
ℹ️  Vercel: main = production, develop = preview
ℹ️  Para deploy: usar /deploy (merge develop → main)
```

### Transición (ONE-WAY)

> Cuando `/deploy` ejecuta el primer release (version bump a ≥1.0.0):
>
> 1. Tag `main` como vX.Y.Z
> 2. Crear rama `develop` desde `main` (si no existe)
> 3. Activar protección de main (esta sección §2 Post-release aplica)
>
> ⚠️ Esta transición es irreversible. No se vuelve a pre-release.

---

## 3. Code Reuse

#### 3.1 Consultar INVENTORY antes de crear

```
❌ PROHIBIDO: Crear componente/hook/action sin verificar si existe
✅ OBLIGATORIO:
   1. Consultar docs/reference/INVENTORY.md
   2. Si existe algo similar → reutilizar o extender
   3. Si es nuevo → agregarlo al inventario después de crear
```

#### 3.2 File Dependency Awareness

**Antes de modificar CUALQUIER archivo:**

1. Consultar `CODEBASE.md` → File Dependencies
2. Identificar archivos dependientes
3. Actualizar TODOS los archivos afectados juntos

---

## 4. UI / Frontend

#### 4.1 Filtros en cascada por defecto

> Aplica a tablas client-side con 2+ filtros.

```
❌ PROHIBIDO: Hardcodear opciones de filtro estáticas cuando hay 2+ filtros
✅ OBLIGATORIO: Cada filtro calcula opciones del subconjunto filtrado por los OTROS
   Solo desactivar si el issue lo especifica EXPLÍCITAMENTE
   Ver docs/reference/crud-scaffold.md § Layer 6 → Cascading Filters
```

---

## 5. QA

**Trigger:** Cada cambio de código. Verificar con las herramientas del proyecto:

| Herramienta      | Cuándo                   |
| ---------------- | ------------------------ |
| `pnpm lint`      | Cada cambio de código    |
| `pnpm typecheck` | Cada cambio de código    |
| `pnpm test`      | Después de cambio lógico |
| `pnpm test:e2e`  | Antes de deploy          |
| `/audit`         | Auditoría completa       |

---

_TimeKast Factory — Starter Kit Rules (L3)_
