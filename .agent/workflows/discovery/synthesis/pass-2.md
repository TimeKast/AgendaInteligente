# Pass 2: Domain (§5-§8)

> **Scope:** Integraciones, Reglas de Negocio, UI/UX, Infraestructura
> **Pre-requisito:** Pass 1 aprobado

---

## Re-cargar fuentes + Brief actual

> 🔴 **MANDATORY — Re-read sources AND the Brief as it exists now.**
> The hidden chain stop between passes causes context loss. Re-load explicitly.

// turbo

```bash
cat docs/planning/.discovery-wip/deep-dive.md
```

// turbo

```bash
cat docs/planning/.discovery-wip/freeze-map.md
```

// turbo

```bash
cat docs/planning/00_DISCOVERY_BRIEF.md
```

---

## Generar secciones §5-§8

**Append** a `docs/planning/00_DISCOVERY_BRIEF.md`:

### §5 Integraciones

> 🔴 **SOURCE BINDING:** `freeze-map.md` + `deep-dive.md` (API decisions, services)

- APIs externas con tabla (proveedor, propósito, frecuencia, rol, rate limits)
- Reglas de consistencia (canonicalización, mapping, rate limits)
- Servicios terceros ya incluidos en el stack

### §6 Reglas de Negocio

> 🔴 **THIS IS A TRANSCRIPTION, NOT A SUMMARIZATION.**
>
> **Procedure:**
>
> 1. Open `deep-dive.md`
> 2. For EACH feature (FT-001 through FT-NNN), find the "Reglas de negocio" field
> 3. Extract EACH `BR-XXX-NNN: description` as an individual row
> 4. Group them by prefix category (see categories below)
> 5. Write EACH one as a separate row in the Brief's §6 tables
>
> **If deep-dive has 99 unique BR-XXX, the Brief MUST have ≥90 BR-XXX.**
> Categorize = group. NOT summarize. NOT merge similar rules into one.
>
> **Additional sources:**
>
> - State Machines → `deep-dive.md` → include **VERBATIM** after their category
> - Lockdown Matrix → `freeze-map.md` + `deep-dive.md`
> - Goal Line Normalization → `freeze-map.md`

> 🔴 **CATEGORÍAS temáticas con prefijos propios:**
> (Solo incluir categorías que tengan invariantes)

- BR-LOCK (Lockdown) — bloqueo y visibilidad
- BR-LINE (Líneas) — captura, congelación, modificación
- BR-PICK (Picks) — selección, validación
- BR-GL (Goal Line) — si aplica
- BR-OU (Over/Under) — si aplica
- BR-PARLAY (Parlay Bonus) — si aplica
- BR-SCORE (Scoring/Evaluación) — engine, recomputación
- BR-SURV (Survivor Picks) — picks survivor
- BR-SURV-ENGINE (Survivor Engine) — state machine, eliminación
- BR-TOURN (Torneos) — lifecycle, freeze, membership
- BR-SEG (Segments) — si aplica
- BR-INV (Invites/Membership) — si aplica
- BR-NOTIF (Notifications) — si aplica
- BR-DUMMY (Dummy Users) — si aplica
- BR-AUTO (Automation) — si aplica
- BR-AUTO-PICK (Autopick) — si aplica
- BR-LB (Leaderboard) — si aplica
- BR-HOST (Host Dashboard) — si aplica
- BR-ADMIN (Admin Panel) — si aplica
- BR-MKT (Marketplace) — si aplica
- BR-RES (Results) — si aplica
- BR-BD (Breakdown) — si aplica
- BR-STATS (Stats) — si aplica
- BR-EXPORT (Export) — si aplica
- BR-INFO (Tournament Info) — si aplica
- BR-DASH (Dashboard) — si aplica

> Cada categoría con su tabla: `| ID | Invariante | Reversibilidad |`
> State machines como diagramas text después de su categoría respectiva.

> 🔴 **MANDATORY BR COUNT CHECK** — Run this AFTER writing §6:

// turbo

```bash
echo "=== BR COUNT CHECK ===" && echo -n "BRs in deep-dive: " && grep -oE 'BR-[A-Z]+-[0-9]+' docs/planning/.discovery-wip/deep-dive.md | sort -u | wc -l && echo -n "BRs in Brief §6: " && grep -oE 'BR-[A-Z]+-[0-9]+' docs/planning/00_DISCOVERY_BRIEF.md | sort -u | wc -l
```

> **If Brief count < deep-dive count × 0.9 → STOP. You lost BRs. Go back and add the missing ones.**

### §7 UI/UX

> 🔴 **SOURCE BINDING:**
>
> - Pantallas → `deep-dive.md` (tabla completa con rol, formato, descripción)
> - Principios visuales → `freeze-map.md` + `deep-dive.md`
> - Navegación → `freeze-map.md` (si definida o deferred como OQ)
> - Componentes reutilizables → `deep-dive.md` (si listados)
> - **Flujos Críticos** → `deep-dive.md` (FL1-FL10 si existen).
>   **NO OMITIR FLUJOS.** `/design` los necesita para diseñar pantallas.
>   Si deep-dive no tiene flujos → marcar como `[OQ — Deferred to /design]`

- Principios visuales (lista)
- Pantallas principales (tabla con pantalla, rol, formato, descripción)
- **Flujos Críticos** (tabla con flujo, pantallas, trigger → resultado)
- Navegación (si definida o deferred)
- Componentes reutilizables de primer nivel (si identificados)
- Skins/variantes visuales (si aplica)

### §8 Infraestructura

> 🔴 **SOURCE BINDING:**
>
> - Stack → `freeze-map.md` (Factory stack)
> - Automation jobs → `deep-dive.md` (tabla con frecuencia, propósito, fallback)
> - Timezone → `freeze-map.md` (**VERBATIM** — no reinterpretar)
> - Real-time → `freeze-map.md` + `deep-dive.md`
> - Delivery → `freeze-map.md` (paralelo/secuencial, deadline)

- Stack técnico (tabla componente → tecnología)
- Automation (jobs con frecuencia, propósito, fallback)
- Real-time updates strategy
- Timezone rules (**copiar EXACTO de freeze-map, no reinterpretar**)
- Delivery phasing / milestones (`[INFERRED]` si no están en freeze-map)

---

## Consistency Check — Pass 2 vs Pass 1

Verificar:

| Check                       | Status |
| --------------------------- | ------ |
| §2 Usuarios ↔ §6 Reglas     | ✅/🔴  |
| §3 Features ↔ §7 Pantallas  | ✅/🔴  |
| §3 Features ↔ §4 Entidades  | ✅/🔴  |
| §4 Datos ↔ §5 Integraciones | ✅/🔴  |

Si hay inconsistencia → corregir AHORA, no en Pass 3.

---

## Drift Guard Check — Pass 2

Ejecutar la checklist de `_rules.md` sobre las secciones §5-§8.

Mostrar resultado: `Drift Guard Pass 2: ✅ clean / 🔴 [items]`

---

## Completeness Assertion — Pass 2

> 🔴 **RUN THESE COMMANDS. DO NOT FILL THE TABLE FROM MEMORY.**

// turbo

```bash
echo "=== PASS 2 COMPLETENESS ===" && echo -n "Unique BRs in deep-dive: " && grep -oE 'BR-[A-Z]+-[0-9]+' docs/planning/.discovery-wip/deep-dive.md | sort -u | wc -l && echo -n "Unique BRs in Brief: " && grep -oE 'BR-[A-Z]+-[0-9]+' docs/planning/00_DISCOVERY_BRIEF.md | sort -u | wc -l && echo -n "Screens in deep-dive: " && grep -cE '^| P[0-9]' docs/planning/.discovery-wip/deep-dive.md 2>/dev/null || echo "0" && echo -n "Screens in Brief: " && grep -cE '^\| P[0-9]' docs/planning/00_DISCOVERY_BRIEF.md && echo -n "Flows in Brief: " && grep -cE '^\| FL' docs/planning/00_DISCOVERY_BRIEF.md
```

> **Display the ACTUAL output above as your Completeness table.**
> **If BR Brief count < deep-dive count × 0.9 → STOP. You lost BRs. Fix before continuing.**

---

---

## 🛑 CHECKPOINT PASS 2

Pass 2 done: §5-§8 generados.

**Mostrar al usuario:**

- [N] BRs únicos transcritos (vs [N] en deep-dive)
- [N] pantallas documentadas
- [N] flujos críticos
- Consistency Check: ✅/🔴
- Drift Guard: ✅/🔴

**OPTIONS:** `1=continue, 2=stop`

🛑 **STOP — DO NOT continue. DO NOT load pass-3. Wait for user response.**

**Only AFTER user responds "1":**

```bash
cat ./.agent/workflows/discovery/synthesis/pass-3.md
```
