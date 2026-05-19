# Synthesis Rules (Shared — Loaded Once)

> 🔴 **Estas reglas aplican a CADA pass de generación.**
> Se cargan UNA VEZ al inicio de Phase 6. No recargar.

---

## Drift Guard (MANDATORY per pass)

> 🔴 **ANTES de escribir CADA sección, verificar contra el Freeze Map:**

Al redactar el brief:

- **Preservar** nombres propios, ownership, deadlines y milestones **verbatim**
- **No convertir** recomendaciones en decisiones firmes
- **No subir** items de future / no-MVP a MVP
- **No tratar** referencia legacy como source of truth
- **Marcar** inferencias explícitamente con confidence tags

### Drift Guard Checklist (Run after EACH pass)

```markdown
## Drift Guard

- [ ] No cambié stakeholder principal
- [ ] No reinterpreté deadlines o target dates
- [ ] No alteré el alcance MVP sin evidencia
- [ ] No convertí reference/legacy en source of truth
- [ ] No agregué decisiones nuevas como si fueran firmes
- [ ] No promoví recomendaciones a decisiones cerradas
- [ ] No inventé business rules que no estén en el source
```

**Si cualquiera falla → corregir antes de continuar.**

---

## Source Hierarchy (MANDATORY)

> 🔴 **Cuando hay contradicción entre fuentes, la de mayor autoridad GANA.**

```
freeze-map.md  →  Autoridad MÁXIMA (decisiones firmes del stakeholder)
deep-dive.md   →  Autoridad ALTA (specs detalladas por feature)
sk-leverage.md →  Autoridad MEDIA (análisis de reuso)
Source Package  →  Autoridad BASE (docs originales del stakeholder)
Memoria/Context →  Autoridad CERO (NUNCA usar como fuente)
```

**Regla:** Si `freeze-map.md` dice "solo Superhost crea dummies" y `deep-dive.md` dice
"super_admin o platform_admin" → **freeze-map gana**. El freeze-map es la resolución final.

**Regla:** Si ningún WIP cubre un dato → buscarlo en Source Package.
Si tampoco está ahí → marcarlo como `[OQ]`, NUNCA inventar.

---

## Confidence Tags

| Tag            | Cuándo usar                               | En el brief                    |
| -------------- | ----------------------------------------- | ------------------------------ |
| _(sin tag)_    | Dato confirmado por source o usuario      | "Deadline: 17 de mayo 2026"    |
| `[INFERRED]`   | Deducción razonable de varias pistas      | "Se infiere [INFERRED] que..." |
| `[ASSUMPTION]` | Hipótesis de trabajo, no decisión cerrada | "[ASSUMPTION] Se asume que..." |
| `[OQ]`         | Info pendiente que requiere input         | "[OQ] ¿Cuál es el rate limit?" |

> Un `Confirmed` que en realidad es `Inferred` = **drift silencioso**.

---

## Source Document References (MANDATORY in Brief)

> 🔴 **El brief DEBE incluir Source Package section.**

```markdown
## 📦 Source Package

| #   | Documento | Clasificación | Key Decisions      | Ubicación                            |
| --- | --------- | ------------- | ------------------ | ------------------------------------ |
| 1   | [nombre]  | SoT           | [decisiones clave] | [path o "proporcionado por usuario"] |
```

---

## Decision Registry (MANDATORY in Brief)

> 🔴 **El brief DEBE incluir Decision Registry.**

```markdown
## 📋 Decision Registry

| #   | Decisión   | Tipo                      | Fuente | Evidencia    | Reversibilidad   | Sección |
| --- | ---------- | ------------------------- | ------ | ------------ | ---------------- | ------- |
| D1  | [decisión] | Firm / Open / Recommended | [doc]  | [cita o ref] | Low / Med / High | §X      |
```

---

## Reconciliation Checklist Template (MANDATORY in Pass 3)

> 🔴 **CADA entidad, pantalla y feature mencionada en prosa → cruzar en la checklist.**
> La prosa es la fuente de verdad, la reconciliation es el índice verificable.

### Entities Registry (4-column cross-map)

```markdown
| #   | Entidad | §4.1 | §3.1 Feature | §7.2 Pantalla | §6 Reglas |
| --- | ------- | ---- | ------------ | ------------- | --------- |
| E1  | [name]  | ✅   | F[X]         | P[Y]          | BR-[Z]    |
```

> CADA entidad de §4.1 MUST appear. If an entity is mentioned in any section but missing from this table → Reconciliation is INCOMPLETE.

### Screens Registry

```markdown
| #   | Pantalla | §7.2 | Entidades | Roles |
| --- | -------- | ---- | --------- | ----- |
| P1  | [name]   | ✅   | E[X,Y]    | [rol] |
```

### Features Cross-Map

```markdown
| Feature §3 | Entidades §4 | Pantallas §7 | Reglas §6 |
| ---------- | ------------ | ------------ | --------- |
| F[X]       | E[Y,Z]       | P[W]         | BR-[V]    |
```

---

## Drift Report Template (MANDATORY in Pass 3)

> 🔴 **DEBE incluirse como sección del Brief, no solo en validation.**

```markdown
## 📊 Drift Report

| #   | Item         | Categoría                                 | Severidad        | Acción                  |
| --- | ------------ | ----------------------------------------- | ---------------- | ----------------------- |
| 1   | [qué cambió] | harmless / helpful / risky / unauthorized | low / med / high | keep / clarify / remove |

**Total:** N items | Unauthorized: N | Risky: N | Safe: N
```

---

## Delivery Phasing Template (Si Aplica)

> Para proyectos con 5+ features. `[INFERRED]` — propuesta, no decisión firme.

```markdown
## Delivery Phasing

### Milestone 1 — [Name]

| Epic     | Features       | Rationale     |
| -------- | -------------- | ------------- |
| EPIC-[X] | FT-[N], FT-[M] | [why grouped] |
```

---

## Stop Conditions

| Condición                                    | Severidad | Acción                        |
| -------------------------------------------- | --------- | ----------------------------- |
| No hay primary source en D1                  | P0        | 🛑 STOP                       |
| Contradicción material no resuelta           | P0        | 🛑 STOP o marcar OQ explícita |
| Drift detectado en ownership / dates / scope | P0        | 🛑 STOP                       |
| §1 / §2 / §3 / §6 en 🔴                      | P0        | 🛑 STOP                       |
| Brief bonito pero no trazable a fuentes      | P1        | Corregir                      |

---

_Synthesis Rules — Loaded once, applied to all 3 passes_
