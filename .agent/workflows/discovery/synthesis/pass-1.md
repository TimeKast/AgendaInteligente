# Pass 1: Foundation (§1-§4)

> **Scope:** Idea General, Usuarios, Funcionalidades, Modelo de Datos
> **Pre-requisito:** Synthesis rules loaded (`_rules.md`)

---

## Re-cargar artefactos intermedios

> 🔴 **MANDATORY — NEVER skip these commands.**
> Even if you "just created" the WIP files, you MUST re-read them via `cat`.
> Working from memory causes compression and information loss.
> "I already have them in context" is NOT a valid reason to skip.

// turbo

```bash
cat docs/planning/.discovery-wip/freeze-map.md
```

// turbo

```bash
cat docs/planning/.discovery-wip/deep-dive.md
```

// turbo

```bash
cat docs/planning/.discovery-wip/sk-leverage.md 2>/dev/null || echo "No SK Leverage (SK_ACTIVE=false)"
```

---

## Generar secciones §1-§4

Crear `docs/planning/00_DISCOVERY_BRIEF.md` con:

### §1 Idea General

> 🔴 **SOURCE:** `freeze-map.md` decisiones de scope, pitch, deadline, principios.

- Pitch (qué es, para quién)
- Problema que resuelve (lista concreta)
- North Star (métrica de éxito)
- Qué es / Qué NO es (tabla — COPIAR de freeze-map)
- Principios de Producto (si el source los define — COPIAR, no resumir)
- Deadline (VERBATIM de freeze-map)
- Stack (VERBATIM)

### §2 Usuarios y Roles

> 🔴 **SOURCE BINDING:**
>
> - Roles table → `freeze-map.md` (decisiones de roles). Incluir TODAS las columnas.
> - Dummy Users → `freeze-map.md` (decisiones de dummy users). **VERBATIM — incluir TODAS las filas.**
>   Si freeze-map tiene 15+ filas de spec → el Brief DEBE tener 15+ filas. No resumir a 5.
> - Capabilities (Superhost, Co-host) → `freeze-map.md`
> - Identity rules (username, display name) → `freeze-map.md`
> - **Tabla de permisos por acción** → `freeze-map.md` + `deep-dive.md` cross-ref
> - Si freeze-map contradice deep-dive → **freeze-map GANA** (ver `_rules.md` Source Hierarchy)

- Tabla de roles con descripción, capacidades y restricciones
- Capabilities especiales (ej: Superhost)
- Dummy users (si aplica — spec **COMPLETA**, no resumen)
- Username / Display name rules
- Registro y acceso
- **Tabla de permisos por acción** (roles × acciones)

### §3 Funcionalidades Core

> 🔴 **SOURCE BINDING:**
>
> - Feature list → `deep-dive.md` (IDs, nombre, criticidad, formato, complexity)
> - SK Leverage Summary → `sk-leverage.md` summary table (**COPIAR**, no recalcular)
> - Formatos de torneo → `freeze-map.md`
> - Scope boundaries (incluido/excluido) → `freeze-map.md`
> - Autopick → `freeze-map.md` + `deep-dive.md`. **SPEC COMPLETA:**
>   INCLUIR: doble nivel control, algoritmos por formato, conflictos Survivor,
>   game eligibility, data model fields, engine (hook/cron), timing.
>   Un resumen de 4 líneas cuando hay una spec de 30 líneas = **DRIFT GRAVE**.

- Feature list con ID, nombre, criticidad, formato, complexity
- SK Leverage Summary (si SK_ACTIVE — copiar de Phase 5)
- Formatos de torneo (variantes + SSOT)
- **O/U Modalidades** (si aplica)
- **Autopick** (si aplica — spec completa con algoritmos, campos, conflictos)
- Scope Boundaries — incluido / excluido

### §4 Modelo de Datos

> 🔴 **SOURCE BINDING:**
>
> - Entidades → `deep-dive.md` (IDs, descripción, CRUD, owner)
> - Relaciones → `deep-dive.md` (diagrama text)
> - Modelos detallados → `deep-dive.md` (Period, Pick, SurvivorState — con pseudocódigo)
> - Datos sensibles → `freeze-map.md` + `deep-dive.md`

- Entidades principales con descripción, relaciones, CRUD
- Relaciones clave (diagrama text)
- Modelos detallados de entidades complejas (Period, Pick — con pseudocódigo de campos)
- Datos sensibles

> 🔴 **PROFUNDIDAD:** Cada sección debe ser TAN detallada como el deep-dive lo permita.
> Si el deep-dive tiene specs completas (Autopick, Dummy Users, etc.) → incluirlas completas.
> Un resumen de 2 líneas cuando hay una spec de 30 líneas = pérdida de información.

---

## Drift Guard Check — Pass 1

Ejecutar la checklist de `_rules.md` sobre las secciones §1-§4.

Mostrar resultado: `Drift Guard Pass 1: ✅ clean / 🔴 [items]`

---

## Completeness Assertion — Pass 1

> 🔴 **RUN THESE COMMANDS. DO NOT FILL THE TABLE FROM MEMORY.**

// turbo

```bash
echo "=== PASS 1 COMPLETENESS ===" && echo -n "Features in deep-dive: " && grep -cE '### FT-[0-9]+' docs/planning/.discovery-wip/deep-dive.md && echo -n "Features in Brief: " && grep -cE 'FT-[0-9]+' docs/planning/00_DISCOVERY_BRIEF.md | head -1 && echo -n "Entities in Brief: " && grep -cE '^\| E[0-9]' docs/planning/00_DISCOVERY_BRIEF.md && echo -n "Roles in Brief: " && grep -cE 'super_admin|platform_admin|host|user' docs/planning/00_DISCOVERY_BRIEF.md | head -1
```

> **Display the ACTUAL output above as your Completeness table.**
> **If Features in Brief < Features in deep-dive → STOP. Fix before continuing.**

---

---

## 🛑 CHECKPOINT PASS 1

Pass 1 done: §1-§4 generados.

**Mostrar al usuario:**

- [N] features listados ([N]/[N] del deep-dive)
- [N] entidades en modelo de datos
- [N] roles documentados con permissions matrix
- Drift Guard: ✅/🔴

**OPTIONS:** `1=continue, 2=stop`

🛑 **STOP — DO NOT continue. DO NOT load pass-2. Wait for user response.**

**Only AFTER user responds "1":**

```bash
cat ./.agent/workflows/discovery/synthesis/pass-2.md
```
