# Phase 5: SK Leverage Analysis

> **Propósito:** Analizar qué componentes del Starter Kit se reutilizan por feature.
> **Condicional:** Solo si `SK_ACTIVE = true` (detectado en Phase 1).
> **Si SK_ACTIVE = false → Saltar a Phase 6 (Synthesis).**
>
> ⚠️ **Diseño modular:** Esta fase está amarrada al SK actual.
> Cuando el discovery sea stack-agnostic, reemplazar este archivo
> por una versión genérica que soporte otros frameworks/templates.

---

## 🔴 Fuentes OBLIGATORIAS (SSOT del SK)

> 🔴 **NUNCA inspeccionar `src/` directamente para determinar capacidades del SK.**
> Las fuentes autorizadas son ÚNICAMENTE los docs de referencia:

// turbo

```bash
cat ./docs/reference/features.md 2>/dev/null || echo "🔴 BLOCKER: No features.md — no se puede hacer SK Leverage"
```

// turbo

```bash
cat ./docs/reference/component-catalog.md 2>/dev/null || echo "⚠️ No component-catalog.md — leverage será parcial"
```

**Si `features.md` no existe → REPORTAR BLOCKER y saltar fase.** No inventar leverage.

> **¿Por qué no inspeccionar `src/`?** Porque el codebase contiene código de ejemplo,
> stubs, y configuraciones que no representan features reales del SK.
> `docs/reference/` es curado y preciso. `src/` es ruidoso y engañoso.

---

## 5.2 SK Leverage por Feature

Para CADA feature del Deep-Dive, analizar contra lo cargado de `features.md` y `component-catalog.md`:

### SK Leverage: FT-{ID}

| Sub-feature     | SK Component    | Acción         | Effort |
| --------------- | --------------- | -------------- | ------ |
| [sub-feature 1] | [componente SK] | **Configurar** | S      |
| [sub-feature 2] | [componente SK] | **Extender**   | M      |
| [sub-feature 3] | ❌ No existe    | **Construir**  | L      |

**SK Coverage: X%** — Custom: [qué es nuevo]

### Acciones posibles:

| Acción         | Significado                                                  | Effort típico |
| -------------- | ------------------------------------------------------------ | ------------- |
| **Configurar** | El componente SK existe tal cual, solo configurar props/data | S             |
| **Extender**   | El componente SK existe pero necesita modificaciones         | M             |
| **Construir**  | No existe en el SK, construir desde cero                     | L-XL          |

---

## 5.3 SK Leverage Summary + Persist

| Feature   | SK Coverage | Configurar | Extender | Construir |
| --------- | ----------- | ---------- | -------- | --------- |
| FT-001    | 80%         | 3          | 1        | 0         |
| FT-002    | 40%         | 1          | 1        | 2         |
| **Total** | **X%**      | **N**      | **N**    | **N**     |

> Este resumen se incluye en el Brief como §3.2 "SK Leverage Summary".
> Downstream (/docs, /backlog) lo usan en vez de cargar N docs del SK.

### Persistir SK Leverage

// turbo

```bash
mkdir -p docs/planning/.discovery-wip
```

Guardar el SK Leverage completo (leverage por feature + summary) en:
`docs/planning/.discovery-wip/sk-leverage.md`

---

_Phase 5 Complete → Retornar a discovery.md (Phase 6 Synthesis)_
