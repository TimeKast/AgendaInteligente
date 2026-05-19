# Pass 1: Visual Direction + Structure

> **Output:** §0 Visual Direction, §1 Mapa de Pantallas, §2 Navegación, §3 Flujos Principales
> **Carga:** Después de CHECKPOINT 1 aprobado + `_rules.md`

---

## Secciones a Generar

| Sección               | Contenido                                                        | IDs     |
| --------------------- | ---------------------------------------------------------------- | ------- |
| §0 Visual Direction   | Paleta, tipografía, icons, shell, motion, density, anti-patterns | —       |
| §0.1 SK Migration     | Impacto vs SK, componentes afectados, creative freedom, estimate | —       |
| §1 Mapa de Pantallas  | URL, propósito, acceso por rol, **FT-XXX**                       | SCR-XXX |
| §2 Navegación         | Mobile tabs, desktop sidebar, RBAC nav                           | —       |
| §3 Flujos Principales | Mermaid diagrams, states, errors                                 | FLW-XXX |

---

## §0.1 — SK Style Migration Assessment

> 🔴 **OBLIGATORIO cuando §0 Visual Direction difiere del SK default.**
> Si §0 mantiene el paradigma actual (ej: Neumorphism) → generar fila única "✅ No migration needed".

**Inputs (ya cargados en context-loading):**

- `design-system.md` — §2 Tokens, §3 Utility Classes, §7 Component Patterns
- `layout-patterns.md` — Patterns que usan clases neo-\*
- `navigation.md` — Shell y active states

**Generar tabla de impacto:**

| Aspecto               | SK Actual (de design-system.md) | Proyecto (de §0)       | Acción                                               |
| --------------------- | ------------------------------- | ---------------------- | ---------------------------------------------------- |
| Paradigma visual      | Neumorphism (neo-\*)            | [de §0]                | ✅ Mantener / 🔧 Override / ❌ Eliminar              |
| Temas                 | light, dark, midnight           | [de §0]                | ✅/🔧/❌ por tema                                    |
| Shadow tokens (9)     | §2 design-system.md             | [derivar de paradigma] | Override `--neo-light`, `--neo-dark` / Nuevos tokens |
| Utility classes (6+3) | §3 design-system.md             | [derivar]              | Mantener / Renombrar / Eliminar                      |
| Layout patterns       | layout-patterns.md checklist    | [verificar]            | Mantener / Adaptar                                   |
| Nav active states     | `neo-inset-sm` en Sidebar       | [de §0 shell]          | Mantener / Cambiar                                   |

**Componentes afectados** (de `design-system.md` §7):

- Listar componentes cuyo shadow/state cambia vs SK actual
- Count: N de M componentes totales

**Creative Freedom Zone:**

- Tokens/clases **nuevos** que no existen en SK (invención del design)
- Animaciones o patterns no contemplados en SK
- Justificación: por qué estos elementos mejoran el diseño del proyecto

**Migration Estimate:**

- Estimated backlog issues para migration (N issues)
- Si es migration mayor (>5 componentes) → DD obligatoria en Pass 2 §6

---

## §1 — Cross-reference por pantalla

| Campo                | Obligatorio | Ejemplo        |
| -------------------- | ----------- | -------------- |
| `Features: FT-XXX`   | ✅          | FT-002, FT-007 |
| `Implementa: US-XXX` | ✅          | US-010, US-013 |
| `Acceso: P-XXX`      | ✅          | P-003 (Host)   |
| `Valida: BR-XXX`     | si aplica   | BR-012         |
| `Data: E-XXX`        | si aplica   | E-001 (users)  |

## Scope Notes (OBLIGATORIO para pantallas delgadas)

Si una pantalla cubre un feature de manera parcial o simplificada
respecto al Brief, documentar un campo `Scope Note`:

```
Scope Note: MVP solo browse + join. Filtros/search diferidos a v1.1.
```

- **Propósito:** Diferenciar poda consciente (documentada) de omisión accidental (gap)
- **Aplica cuando:** El Brief o Feature Map describe más funcionalidad
  de la que el design implementa para esa pantalla

---

> 🛑 **STOP — Pasada 1 completada.**
> **OBLIGATORIO:** Llamar `notify_user` con resumen de §0-§3 ANTES de cargar la siguiente pasada.
> **NO leer ni ejecutar pass-2.md hasta recibir aprobación del usuario.**

_Pass 1 Complete → Orchestrator maneja checkpoint_
