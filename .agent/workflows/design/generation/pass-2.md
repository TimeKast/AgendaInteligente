# Pass 2: Components + Decisions

> **Output:** §4 Componentes por Pantalla, §5 Data Requirements, §6 Decisions, §7 OQ, §8 Assumptions
> **Carga:** Después de checkpoint inter-pasada 1

---

## Secciones a Generar

| Sección           | Contenido                                           | IDs          |
| ----------------- | --------------------------------------------------- | ------------ |
| §4 Componentes    | SK usados + nuevos + interaction states             | CMP-XXX      |
| §5 Data Req       | §5.0 Cache model + lifecycle, tabla mutations       | —            |
| §6 Decisions      | Opciones + elegida + razón + **Data Impact**        | DD-XXX       |
| §7 Open Questions | Heredar Brief §7 + clasificar arch/product/cosmetic | OQ-XXX       |
| §8 Assumptions    | §8.1 Supuestos, §8.2 **Deferred to Backlog**        | A-XXX, D-XXX |

---

## §4 — Por cada SCR, especificar:

1. Componentes SK a usar (con variantes si aplica)
2. Componentes nuevos a crear (con `CMP-XXX`)
3. Estados de la pantalla (loading, empty, error, data)
4. **Surface hierarchy** (base → card → input depth levels)
5. **Interaction states** para componentes interactivos:

| Componente | Default | Hover | Selected | Disabled |
| ---------- | ------- | ----- | -------- | -------- |

> Solo para componentes interactivos (cards, toggles, selectores, rows).
> No para texto estático o labels.

> 🔴 **Anti-duplicación:** Verificar `features.md` antes de crear CMP-XXX.

---

## §5 — Data Requirements (obligatorio)

1. **§5.0 Cache model (narrativa antes de tabla):**
   - ¿Cuáles son los eventos de invalidación del sistema?
   - ¿Cuándo se usa polling y por qué?
   - ¿Cuándo es static y qué lo cambia?
   - ¿Hay un modelo push (websocket/SSE) o es todo pull?

2. **Mutation lifecycle por pantalla con mutations:**
   - ¿Qué estado intermedio existe? (draft, pending, confirmed)
   - ¿Qué mutation usa cada acción del usuario?
   - ¿Cuándo se snapshotea/audita?
   - ¿Qué pasa si el usuario abandona a mitad?

3. **Tabla de mutations con lifecycle:**

| SCR | Mutation | Trigger | Pre-state | Post-state | Invalidates |
| --- | -------- | ------- | --------- | ---------- | ----------- |

---

## §6 — Cada DD DEBE tener:

| DD  | Decisión | Opciones | Elegida | Razón | Data Impact |
| --- | -------- | -------- | ------- | ----- | ----------- |

**Data Impact (obligatorio si afecta data):**

- Qué mutations/queries cambian según la opción elegida
- Qué estado intermedio existe (draft, pending, etc.)
- Qué se invalida/revalida al ejecutar

---

## §7 — Open Questions

🔴 **Herencia obligatoria de Brief:**

1. Leer `00_DISCOVERY_BRIEF.md` §7 (preguntas abiertas / riesgos)
2. Para cada pregunta del Brief con impacto en UI/UX → heredar a §7
3. Si ya fue resuelta por una DD → documentar como "Resuelta: DD-XXX"

**Clasificación obligatoria:**

| Categoría       | Definición                                       | Ejemplo              |
| --------------- | ------------------------------------------------ | -------------------- |
| `architectural` | Impacta modelo de datos, cache, real-time, state | Real-time vs polling |
| `product`       | Impacta scope, funcionalidad, roles              | ¿Playoffs en MVP?    |
| `cosmetic`      | Solo apariencia, no funcionalidad                | ¿Logo SVG o PNG?     |

**Mínimos:** Al menos 1 `architectural` + 1 `product` (si Brief §7 los tiene).

---

## §8 — Assumptions + Deferred

### §8.1: Design Assumptions

| A-XX | Supuesto | Si es incorrecto |

### §8.2: Deferred to Backlog

| D-XX | Ambigüedad | Pantalla | Impacto |

> Temas que conscientemente NO se resuelven en design,
> se dejan para resolver en issues de backlog.

---

> 🛑 **STOP — Pasada 2 completada.**
> **OBLIGATORIO:** Llamar `notify_user` con resumen de §4-§8 ANTES de cargar la siguiente pasada.
> **NO leer ni ejecutar pass-3.md hasta recibir aprobación del usuario.**

_Pass 2 Complete → Orchestrator maneja checkpoint_
