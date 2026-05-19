# Methodology — Intake (bulk attachments, modes, schemas, reconciliation, invalidation)

> Sub-file of `tk-discovery/methodology/`. See parent `methodology.md` for the full index.
> Topical scope: how the source package is ingested (Phase 1) — bulk rules, media-type strategies, mode classification, per-file schema, cross-file reconciliation appendix, and cross-phase invalidation handling.

---

## §2 — Bulk Attachments Rule

🔴 **NUNCA** silent sampling. Si el user trae 40 screenshots o 6 Excels, procesar **TODOS**.

Opciones válidas cuando el volumen es extremo:

- **Particionado explícito:** declarar en texto "procesando batch 1 de 3 (items 1-15)"
- **Paralelización:** delegar a `dsc-intake-analyst` con batching determinístico (ver §2.1 + SKILL.md Phase 1)
- **Priorización por relevancia declarada:** "procesando primero los 10 marcados como críticos, después el resto"

Lo que **NO** es válido:

- Procesar 6 de 40 y seguir como si fuera completo
- Asumir representatividad de una muestra sin declararlo
- Saltarse attachments "porque parecen similares"

Si por límite real se omite algo, DECLARAR qué y por qué.

### §2.1 — Intake Strategies by Media-Type

**Doctrina:** implementar solo strategies para media-types con ≥1 caso real. Tipos novel → drift ticket + continue. Promoción de Tier 2 → Tier 1 es decisión manual del Factory maintainer (harvest process, fuera de scope de este methodology).

#### Tier 1 — Strategies implementadas ahora

| Type                                | Extension / detector                                              | Strategy                                                                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structured text                     | `.md` con headings/tables/lists                                   | 4-dim detector (`methodology/source-classification.md` §1.1)                                                                                                                           |
| Transcript conversational           | `.md` / `.txt` de Fathom / Fireflies (timestamps + speaker attr.) | Conversational parser: attribute decisions to speakers; detect "acordamos", "let's go with", "pendiente", "quedó pending"                                                              |
| Visual (UI / diagrams / whiteboard) | `.jpg` / `.jpeg` / `.png`                                         | Multimodal review per-image: visual description, UI elements, semantic grouping, UX patterns. **Review all del batch.** Batching determinístico — ver SKILL.md Phase 1 batch planning. |

#### Tier 2 — Types sin strategy detallada (drift-ticket-ready)

Cuando `dsc-intake-analyst` detecta cualquiera de estos, emite `intake-drift` ticket + continúa con `[MEDIA-PENDING-STRATEGY]` en report. Pipeline NO se detiene; field correspondiente queda `[OQ]`.

| Type              | Detector                                     | Suggestion en ticket                                    |
| ----------------- | -------------------------------------------- | ------------------------------------------------------- |
| `.docx`           | Extension match                              | "treat as structured text if text extraction available" |
| `.pdf` text-layer | Extension + heuristic "has extractable text" | "pdftotext + apply 4-dim detector"                      |
| `.pdf` scan       | Extension + heuristic "no text layer"        | "OCR required; do not hallucinate"                      |
| `.xlsx` / `.csv`  | Extension match                              | "headers + sample rows; classify as Attachment"         |
| Unknown           | Extension no match + magic bytes no match    | "human triage"                                          |

#### Escalation rule

Si count de `intake-drift` tickets en un single run **≥3** → main orchestrator surface summary al user al cierre de Phase 1 (antes de CP1):

```
⚠️ Phase 1 cerrada con {N} intake-drift tickets emitidos:
  - {path-1} → type={T1}
  - ...
¿Revisar tickets antes de Phase 2, o continuar con drift async?
```

---

## §6 — Modos D0 / D1 / D2

Tres modos según input quality:

| Modo | Input                      | Estrategia                                | Mínimo preguntas                                 |
| ---- | -------------------------- | ----------------------------------------- | ------------------------------------------------ |
| D0   | Desde cero (idea sin docs) | Full Socratic interview                   | No aplica — es la interview                      |
| D1   | Con docs existentes        | Parse → tag → freeze → solo gaps genuinos | `max(3, 🟡 sections + contradictions)` — NUNCA 0 |
| D2   | Validar brief existente    | Load → verify → drift report              | Según drift detectado                            |

Regla D1: "0 preguntas nunca es válido". Input rico = **mejores** preguntas, no menos preguntas.

---

## §7 — Reconciliation Appendix A — mechanics

El Appendix A del brief es un checklist **mecánico** post-prosa. No agrega contenido, verifica consistencia cruzada.

### A.1 Entidades Registradas

Para CADA entidad mencionada en la prosa, una fila:

| # | Entidad | Aparece en §4.1 | Feature relacionada §3.1 | Pantalla §7.2 | Regla §6 |

Si una entidad aparece en §3 Features pero NO en §4 Modelo de Datos → **gap detectado**.

### A.2 Pantallas Registradas

Para CADA pantalla mencionada en la prosa, una fila:

| # | Pantalla | §7.2 | Entidades que muestra | Roles que acceden |

Si una pantalla no tiene entidades ni roles → **gap detectado**.

### A.3 Features Cross-Map

Para CADA feature, una fila completa:

| Feature | Entidades afectadas | Pantallas involucradas | Reglas de negocio aplicables |

Si una feature carece de una de las 3 columnas → spec incompleto.

### Por qué es mecánico y no contenido

- La prosa §1-§11 es **fuente de verdad**.
- Appendix A es el **índice verificable** construido mecánicamente desde la prosa.
- Nadie edita Appendix A directamente — se regenera del contenido.
- Si la prosa dice "feature usa entidad X" pero Appendix A no lo refleja → bug en el generador (re-correr, no editar manual).

---

## §10 — Intake Explore Schema

Shape del reporte estructurado que `dsc-intake-analyst` produce por-file.

**Principio:** raw extraction per-file, no consolidación. Main orchestrator traduce "extracted" → firm / inferred / contradicted al armar el Freeze Map (`methodology/freeze-map.md` §3) cross-file. Los buckets aquí se llaman deliberadamente distinto al Freeze Map para evitar confusión entre raw source extraction y consolidación post-cross-file.

```markdown
## File: {path}

### Media-type detected

{ext} + {magic-bytes-hint} → {strategy-applied} (Tier 1 | Tier 2-drift)

### Classification (source hierarchy)

SoT / Reference / Legacy / Attachment / Context

### Extracted decisions (claims made in this file)

- {claim} (fuente: §X del doc)

### Extracted questions (gaps in this file)

- {question} (owner hint: Cliente / TimeKast / TBD)

### Intra-file tensions (same file, contradictory statements)

- {tensión} (cita A vs cita B del mismo doc)

> Cross-file contradictions NO van aquí — las detecta el main orchestrator al consolidar Freeze Map.

### Implicit claims (Fix #1 dim C — bullet patterns)

- Firm-candidate: {bullet + cita + ruta}
- Question-candidate: {bullet + qualifier}
- MoSCoW-candidate: {phase → priority}

### Standard-field gaps (Fix #1 dim D)

- {campo faltante: stakeholder / deadline / north_star / success_metric / user_roles / problema}

### Transcription notes

- Verbatim → Transcription notes en `discovery-artifacts/explore-pass/{batch_id}-{slug}.md` §{N}
- Summarized → {reason}
- Inferred → [INFERRED] markers

### Escalations (factory-tickets emitted from this file)

- [MEDIA-PENDING-STRATEGY]: {path} → ticket at project/factory/intake-drift-{YYYY-MM-DD}-{slug}.md
- [MEDIA-SCAN-NO-OCR]: {path} → same
- [UNKNOWN-MEDIA-TYPE]: {path} → same
- [CORRUPT-FILE]: {path}
```

### Concurrency contract

Each agent writes to own `discovery-artifacts/explore-pass/{NN}-{slug}.md`. Main orchestrator concatena post-Phase-1 → `discovery-artifacts/explore-pass.md`. No locks required.

### Consolidation mapping (main orchestrator, Phase 2 → Phase 3)

| Explore bucket (per-file, raw) | Freeze Map bucket (cross-file, consolidated)                               |
| ------------------------------ | -------------------------------------------------------------------------- |
| Extracted decisions            | Firm Decisions (coincide cross-file) / Inferred Decisions (solo 1 file)    |
| Extracted questions            | Open Questions                                                             |
| Intra-file tensions            | Tensions (extended con cross-file tensions detectadas por el orchestrator) |
| Standard-field gaps            | Phase 1 follow-up questions / Open Questions if unresolved                 |

---

## §16 — Invalidation handling cross-phase

Cuando una resolution downstream contradice un Firm upstream (ej: Phase 4 Tier L sub-ronda revela Firm F-N de Phase 2 era incorrecto):

### Detección objetiva

Re-read del Firm citado vs nueva resolution. Si contradicen literal → invalidation confirmed. **No juicio**, solo string comparison de la claim literal.

### Prompt al user (nunca automático)

```
⚠️ Contradicción detectada entre Firm F{N} (Phase 2) y resolution en Phase {X}.

F{N}: {quote}
Phase {X} reveals: {evidence}

Opciones:
1. Backtrack → regresar a Phase 2, update Firm F{N}, re-run Phase 3-{X} con cambios
2. Override → mantener Firm F{N}, documentar dissent en §Drift Report del brief
3. Resolve now → proponer nueva Firm F{N}', re-run solo Phase {X} con contexto actualizado
```

User decide. Orchestrator ejecuta según la opción.

### Cascade rule

Si invalidation aprobada (opción 1 o 3) afecta otros Firms dependientes → orchestrator los re-evalúa y surface cada uno como mini-prompt antes de re-correr. NO auto-cascade silencioso.

---

_TimeKast Factory — Discovery methodology / intake (sub-file)_
