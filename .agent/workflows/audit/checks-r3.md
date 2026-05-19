# Phase 2.3: R3 Checks (Deep Multi-Agent Codebase Review)

> **Scope:** Deep codebase review from multiple expert perspectives
> **Tiempo:** ~15-25m
> **Incluye:** R0 + R1 + R2 + multi-agent deep analysis

---

## 🤖 Multi-Agent Deep Review (MANDATORY)

> 🔴 **HARD GATE — NO CONTINUAR SIN EJECUTAR**
>
> R3 no es un checklist mecánico — es una revisión profunda del codebase
> desde 7 perspectivas de especialista.
>
> ⚠️ **CADA perspectiva DEBE leer código fuente real, no solo describir su rol.**
> El agente debe navegar archivos, buscar patterns, y reportar hallazgos concretos
> con paths y líneas de código.

---

## Protocolo de Revisión

> 🔴 **El agente ejecuta TODAS las perspectivas secuencialmente en este mismo chat.**
> NO delegar a `/orchestrate` — este es un flujo de revisión, no de implementación.

### Para CADA perspectiva:

1. **Leer** los archivos relevantes al dominio de la perspectiva
2. **Buscar** los items específicos listados abajo
3. **Reportar** hallazgos con path + línea + descripción del problema
4. **Clasificar** cada hallazgo: 🔴 Critical | 🟡 Warning | 🔵 Info

---

## Perspectiva 1: Architect

**Buscar específicamente:**

- [ ] **Separation of concerns:** ¿Hay business logic en componentes UI? ¿DB queries en server actions o directas en pages?
- [ ] **Pattern consistency:** ¿Todos los módulos siguen el mismo patrón? (ej: todos los CRUDs usan el mismo flow)
- [ ] **Dependency direction:** ¿Hay imports circulares o capas que importan en dirección incorrecta?
- [ ] **Barrel files:** ¿Los `index.ts` exportan lo necesario? ¿Hay re-exports innecesarios?
- [ ] **Naming coherence:** ¿Convenciones de archivos/carpetas son consistentes? (kebab-case, PascalCase, etc.)
- [ ] **Dead code:** ¿Hay exports no consumidos, funciones no llamadas, archivos huérfanos?

**Archivos a revisar:**

```
lib/                    # Estructura general
components/             # Organización de componentes
src/app/                # Routing y pages
```

---

## Perspectiva 2: Security Auditor

**Buscar específicamente:**

- [ ] **Auth bypass:** ¿Todas las server actions verifican sesión? ¿Hay actions públicas que no deberían serlo?
- [ ] **RBAC gaps:** ¿`requirePermission()` se llama en todas las actions que lo necesitan?
- [ ] **Input validation:** ¿Se valida con Zod/schema ANTES de usar datos? ¿Hay `input as any` o casts peligrosos?
- [ ] **SQL injection:** ¿Se usan parameterized queries (Drizzle ORM) o hay `sql.raw()` sin sanitizar?
- [ ] **Secrets exposure:** ¿Variables de entorno están en `.env.example`? ¿Hay secrets hardcodeados en código?
- [ ] **XSS vectors:** ¿Hay `dangerouslySetInnerHTML`? ¿Se sanitizan outputs de usuario?
- [ ] **CSRF protection:** ¿Las acciones de escritura usan POST/server actions?

**Archivos a revisar:**

```
lib/actions/            # Todas las server actions
lib/auth/               # Auth config y middleware
middleware.ts           # Route protection
lib/validations/        # Schemas Zod
.env.example            # Secrets declarados
```

---

## Perspectiva 3: Backend Specialist

**Buscar específicamente:**

- [ ] **Error handling:** ¿Todos los try/catch tienen logging? ¿Se propagan errores correctamente?
- [ ] **DB queries eficientes:** ¿Hay N+1 queries? ¿Se usan `select` específicos vs `select *`?
- [ ] **Race conditions:** ¿Operaciones de escritura concurrent están protegidas? ¿Se usan transactions?
- [ ] **Edge cases sin cubrir:** ¿Qué pasa con arrays vacíos, nulls, strings vacíos en inputs?
- [ ] **Hardcoded values:** ¿Hay magic numbers, URLs, emails, o configuración hardcodeada?
- [ ] **Revalidation correcta:** ¿`revalidatePath` apunta a las rutas correctas?
- [ ] **Type safety:** ¿Hay `any` types? ¿Se usan los tipos correctos de Drizzle?

**Archivos a revisar:**

```
lib/actions/            # Server actions
lib/db/                 # Schema, queries, helpers
lib/validations/        # Zod schemas
```

---

## Perspectiva 4: Frontend Specialist

**Buscar específicamente:**

- [ ] **Hex hardcodeados:** ¿Hay colores hex directos en className o style en lugar de tokens CSS (`text-primary`, `bg-background`)?
- [ ] **Neumorphic consistency:** ¿Todos los cards usan `neo-outset`? ¿Inputs usan `neo-inset`? ¿Buttons usan `neo-interactive`?
- [ ] **Tailwind vs CSS vars:** ¿Se usan tokens del design system (`var(--primary)`) vs valores arbitrarios (`text-[#1e40af]`)?
- [ ] **Responsive:** ¿Las pantallas funcionan en mobile? ¿Hay overflow-x en tablas?
- [ ] **States completos:** ¿Loading states, empty states, error states existen para cada vista?
- [ ] **Accesibilidad:** ¿Botones tienen labels? ¿Imágenes tienen alt? ¿Focusable elements tienen focus-visible?
- [ ] **Componentes duplicados:** ¿Hay componentes que hacen lo mismo con diferente nombre?
- [ ] **Client vs Server:** ¿Hay `'use client'` innecesarios? ¿Componentes servidor donde podrían serlo?

**Archivos a revisar:**

```
components/ui/          # Primitivos UI
components/shared/      # Componentes shared
components/form/        # Formularios
src/app/**/page.tsx     # Pages
src/app/globals.css     # Design tokens
```

---

## Perspectiva 5: Quality Engineer

**Buscar específicamente:**

- [ ] **Coverage gaps:** ¿Qué archivos de business logic NO tienen test? (comparar `lib/` vs `__tests__/`)
- [ ] **Test quality:** ¿Los tests verifican behavior o solo execution? ¿Hay assertions meaningfulas?
- [ ] **Mocks adecuados:** ¿Se mockean las dependencias correctas? ¿Hay over-mocking?
- [ ] **Edge cases en tests:** ¿Se testean empty arrays, null values, boundary conditions?
- [ ] **E2E critical paths:** ¿Los flujos core tienen E2E? (login, CRUD principal, delete)
- [ ] **Scope creep:** ¿Hay features implementadas que no están en el backlog/docs?
- [ ] **TODOs y FIXMEs:** ¿Hay TODOs sin issue asociado en el código?

**Archivos a revisar:**

```
__tests__/              # Tests existentes
lib/                    # Código sin tests
grep -r "TODO\|FIXME"  # TODOs pendientes
```

---

## Perspectiva 6: Documentation Writer

**Buscar específicamente:**

- [ ] **JSDoc en exports públicos:** ¿Las funciones exportadas tienen JSDoc con `@param` y `@returns`?
- [ ] **Types exportados:** ¿Los types en `/types/` tienen comentarios explicando su propósito?
- [ ] **README actualizado:** ¿Instrucciones de setup son correctas? ¿Variables de entorno documentadas?
- [ ] **Comments útiles:** ¿Los comentarios explican el "por qué", no el "qué"? ¿Hay comentarios obsoletos?
- [ ] **Inline docs coherentes:** ¿Los headers de archivos (`/** ... */`) describen correctamente el módulo?
- [ ] **Config documentada:** ¿`env.example` tiene todas las variables necesarias con descripciones?

**Archivos a revisar:**

```
lib/actions/            # Headers y JSDoc
lib/db/schema/          # Schema comments
README.md               # Setup instructions
.env.example            # Variable docs
```

---

## Perspectiva 7: Performance Optimizer

**Buscar específicamente:**

- [ ] **Bundle impact:** ¿Se importan librerías completas donde se podría tree-shake? (`import { specific } from 'lib'` vs `import * as lib`)
- [ ] **Dynamic imports:** ¿Componentes pesados usan `dynamic()` o `lazy()`?
- [ ] **DB query efficiency:** ¿Se seleccionan solo los campos necesarios? ¿Hay queries que traen toda la tabla?
- [ ] **Caching:** ¿Server actions que leen datos frecuentes están cacheadas? ¿`unstable_cache` o similar?
- [ ] **Image optimization:** ¿Se usa `next/image` en lugar de `<img>`?
- [ ] **Re-renders innecesarios:** ¿Hay state updates que causan re-render de componentes pesados?
- [ ] **Pagination:** ¿Las listas grandes tienen paginación o virtual scrolling?

**Archivos a revisar:**

```
package.json            # Dependencies
next.config.*           # Build config
src/app/                # Pages (SSR vs CSR)
lib/actions/            # Query patterns
```

---

## Output Esperado

> 🔴 **CADA perspectiva DEBE incluir hallazgos específicos con path y línea.**
> NO dejar "..." ni resúmenes genéricos como "todo bien".
> Si una perspectiva no encuentra problemas, documentar qué se revisó y por qué está bien.

### Formato de hallazgo individual:

```markdown
### 🔴 [Severidad] Título del hallazgo

**Archivo:** `path/to/file.ts:L42`
**Perspectiva:** architect | security | backend | frontend | quality | docs | performance
**Descripción:** Qué está mal y por qué importa.
**Sugerencia:** Cómo corregirlo.
```

### Tabla resumen (después de TODAS las perspectivas):

| Perspectiva           | 🔴 Critical | 🟡 Warning | 🔵 Info | Veredicto |
| --------------------- | ----------- | ---------- | ------- | --------- |
| architect             | N           | N          | N       | ✅/🔴     |
| security-auditor      | N           | N          | N       | ✅/🔴     |
| backend-specialist    | N           | N          | N       | ✅/🔴     |
| frontend-specialist   | N           | N          | N       | ✅/🔴     |
| quality-engineer      | N           | N          | N       | ✅/🔴     |
| documentation-writer  | N           | N          | N       | ✅/🔴     |
| performance-optimizer | N           | N          | N       | ✅/🔴     |

**Veredicto global:** PASS solo si 0 Critical findings.

---

## Evaluar Resultado Multi-Agent

**Si veredicto = PASS (0 critical):**
→ Continuar a Report

**Si hallazgos 🔴 Critical encontrados:**

```markdown
## ⚠️ R3 Deep Review: Critical Issues

| #   | Perspectiva | Archivo | Hallazgo |
| --- | ----------- | ------- | -------- |
| 1   | ...         | ...     | ...      |

**Opciones:**

| #   | Opción        | Acción                                      |
| --- | ------------- | ------------------------------------------- |
| 1   | **fix**       | Corregir issues críticos antes de continuar |
| 2   | **continuar** | Aceptar y documentar en reporte             |
| 3   | **cancelar**  | Abortar audit                               |

🛑 **Esperar decisión del usuario**
```

**ACTION:** Call `notify_user` with `BlockedOnUser: true`

---

## Pass Criteria (R3)

| Check             | Required     | Blocker if fail?      |
| ----------------- | ------------ | --------------------- |
| R0-R2 checks      | ✅ All pass  | ❌ BLOCKER            |
| Multi-agent audit | Executed     | ❌ BLOCKER if skipped |
| Critical findings | 0 unresolved | ❌ BLOCKER            |
| Security findings | 0 critical   | ❌ BLOCKER            |

> 🔴 **R3 sin ejecutar las 7 perspectivas = INVÁLIDO**

---

_R3 Complete → Continuar a Report_
