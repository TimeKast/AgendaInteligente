# Pass 3: Identity + Appendices (§9-§11 + Registries + Reconciliation)

> **Scope:** Branding, Mobile, Visual Direction, Source Package, Decision Registry, Delivery Phasing, Reconciliation, Drift Report
> **Pre-requisito:** Pass 2 aprobado

---

## Re-cargar fuentes + Brief actual

> 🔴 **MANDATORY — Re-read sources AND the Brief as it exists now.**
> The hidden chain stop between passes causes context loss. Re-load explicitly.

// turbo

```bash
cat docs/planning/.discovery-wip/freeze-map.md
```

// turbo

```bash
cat docs/planning/00_DISCOVERY_BRIEF.md
```

---

## Generar secciones §9-§11

**Append** a `docs/planning/00_DISCOVERY_BRIEF.md`:

### §9 Branding

> 🔴 **SOURCE BINDING:** `freeze-map.md` (branding decisions) + `deep-dive.md` (skins)

- Nombre y logo (estado de assets)
- Paleta de colores (tabla hex + uso)
- Tipografía (definida o deferred)
- Tono de comunicación
- Variantes visuales / Skins (si aplica)
- Assets existentes

### §10 Mobile/PWA

> 🔴 **SOURCE BINDING:** `freeze-map.md` (PWA decisions)

- Device principal (tabla de prioridad)
- Funcionalidad offline
- Capacidades nativas (tabla)
- Instalabilidad
- Performance targets (si definidos o deferred)

### §11 Visual Direction Seeds

> 🔴 **SOURCE BINDING:** `freeze-map.md` + `deep-dive.md` (visual preferences)

- Postura visual
- Referencias visuales
- Nivel premium
- Constraints de marca

---

## Appendices (MANDATORY)

> 🔴 **Todas estas secciones son OBLIGATORIAS. No omitir ninguna.**

### Source Package

Usar template de `_rules.md`. TODOS los docs procesados deben aparecer con clasificación.

### Decision Registry

> 🔴 **SOURCE BINDING:** `freeze-map.md` es la fuente ÚNICA del Decision Registry.
>
> - Firm Decisions → Top 20 de freeze-map
> - Resolved During Discovery → TODAS las resoluciones de gap-interview y checkpoints
> - Si freeze-map tiene 11 resolved → Brief debe tener ≥ 11 resolved (no 3)

Usar template de `_rules.md`. TODAS las decisiones firmes + resolved during discovery.

### Delivery Phasing + Epic Grouping

Si el proyecto tiene 5+ features → generar milestones con epic grouping.
Marcar como `[INFERRED]` — propuesta, no decisión firme.

### Open Questions & Assumptions

> 🔴 **SOURCE BINDING:**
>
> - OQs activas → `freeze-map.md` (OQs que quedaron abiertas)
> - Working Hypotheses → `freeze-map.md` + inferencias del synthesis
> - Resolved → `freeze-map.md` (OQs que se cerraron durante discovery)
> - Cada OQ con impacto, owner, destino (/design, /docs, /backlog)

- Preguntas vivas con impacto, owner, y estado
- Working Hypotheses con categoría y plan de validación
- Deferred items con destino (/design, /docs, /backlog)

### Drift Report

> 🔴 **OBLIGATORIO como sección del Brief.**

Usar template de `_rules.md`. Listar TODO lo introducido por el discovery que NO venía del input original.

Clasificar cada item como: harmless / helpful / risky / unauthorized.

**Si hay unauthorized drift → STOP. Corregir antes de continuar.**

### Riesgos y Mitigaciones (MANDATORY)

> Sección final antes de cerrar. Tabla con riesgos identificados durante discovery.

```markdown
## Riesgos y Mitigaciones

| #   | Riesgo   | Severidad | Mitigación   |
| --- | -------- | --------- | ------------ |
| R1  | [riesgo] | 🔴/🟡/🟢  | [mitigación] |
```

### Reconciliation Checklist (Appendix A)

> 🔴 **CROSS-MAP COMPLETO.** No es un resumen. Es un índice verificable.

Usar los 3 templates de `_rules.md`:

1. **Entities Registry** — CADA entidad de §4.1 cruzada con §3.1, §7.2, §6
2. **Screens Registry** — CADA pantalla de §7.2 cruzada con entidades y roles
3. **Features Cross-Map** — CADA feature de §3.1 cruzada con entidades, pantallas, reglas

> 🔴 **VERIFICACIÓN:** Contar entidades en §4.1, pantallas en §7.2, features en §3.1.
> Si el counts no matches vs Reconciliation → Reconciliation está incompleto. Completar.

### Glosario

Tabla con términos clave del dominio y su definición precisa.

---

## Drift Guard Check — Pass 3

Ejecutar la checklist de `_rules.md` sobre las secciones §9-§11 + appendices.

Verificar que Reconciliation cubre TODAS las entidades/pantallas/features de §1-§8.

Mostrar resultado: `Drift Guard Pass 3: ✅ clean / 🔴 [items]`

---

## Completeness Assertion — Pass 3

> 🔴 **RUN THESE COMMANDS. DO NOT FILL THE TABLE FROM MEMORY.**

// turbo

```bash
echo "=== PASS 3 COMPLETENESS ===" && echo -n "Entities in §4.1: " && grep -cE '^\| E[0-9]' docs/planning/00_DISCOVERY_BRIEF.md && echo -n "Screens in §7.2: " && grep -cE '^\| P[0-9]' docs/planning/00_DISCOVERY_BRIEF.md && echo -n "Features in §3.1: " && grep -cE '^\| FT-[0-9]' docs/planning/00_DISCOVERY_BRIEF.md && echo -n "Unique BRs total: " && grep -oE 'BR-[A-Z]+-[0-9]+' docs/planning/00_DISCOVERY_BRIEF.md | sort -u | wc -l && echo -n "Resolved items: " && grep -cE '^\| RD|^\| R[0-9]' docs/planning/00_DISCOVERY_BRIEF.md && echo -n "Open Questions: " && grep -cE '^\| Q[0-9]' docs/planning/00_DISCOVERY_BRIEF.md && echo -n "Flows: " && grep -cE '^\| FL' docs/planning/00_DISCOVERY_BRIEF.md && echo -n "Total lines: " && wc -l < docs/planning/00_DISCOVERY_BRIEF.md
```

> **Display the ACTUAL output above as your Completeness table.**
> **If Entities/Screens/Features in Reconciliation ≠ counts above → INCOMPLETE. Fix.**

---

---

## 🛑 CHECKPOINT PASS 3

Pass 3 done: Brief completo con §9-§11 + todos los appendices.

**Mostrar al usuario:**

- Total líneas del Brief: [N]
- Reconciliation: entities=[N], screens=[N], features=[N]
- Drift Report: [N] items (unauthorized=[N])
- Open Questions: [N]
- Drift Guard: ✅/🔴

**OPTIONS:** `1=continue to Challenge Pass, 2=stop`

🛑 **STOP — DO NOT continue. Wait for user response.**

**Only AFTER user responds "1" → return to discovery.md Phase 7 (Challenge Pass).**
