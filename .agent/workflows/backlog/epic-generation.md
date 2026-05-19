# Phase 5: Generate Feature Epics + Issues (BATCHED)

> **Propósito:** Generar epics e issues, UN EPIC A LA VEZ.
> **Knowledge:** SKILL.md §4 (format), §5 (ordering), §7 (resolution), §8 (priority)
>
> **Full mode:** Genera todos los epics del plan.
> **Add mode:** Genera un solo issue/epic/milestone.

---

## 5.0 Epic Planning (full mode only)

**Antes de generar cualquier archivo:**

1. Listar TODOS los epics planeados (sin números aún)
2. Para cada epic: ¿depende de otro epic?
3. **Topological sort** → asignar EPIC-NN (ver SKILL §5)
4. Verificar linearidad: "¿Puedo implementar EPIC-01 → 02 → ... sin saltar?"

**Output esperado:**

```markdown
## Epic Plan

| EPIC-NN | Nombre | Depende de | Issues estimados |
| ------- | ------ | ---------- | ---------------- |
| EPIC-01 | ...    | —          | ~5               |
| EPIC-02 | ...    | EPIC-01    | ~8               |
```

**ACTION:** Este plan se muestra en CHECKPOINT 1 para aprobación.

---

## 5.0.1 Check Progress File (Resume Support)

> 🔄 **Si existe `backlog-progress.md`, estamos CONTINUANDO una sesión previa.**

// turbo

```bash
PROGRESS="./docs/backlog/backlog-progress.md"
if [ -f "$PROGRESS" ]; then
  echo "🔄 PROGRESS FILE FOUND — Resuming from previous session"
  echo ""
  cat "$PROGRESS"
  echo ""
  echo "📌 El agente DEBE:"
  echo "  1. Leer el epic plan del progress file"
  echo "  2. Identificar epics con status ⬜"
  echo "  3. Continuar DESDE el primer epic ⬜"
  echo "  4. NO regenerar epics con status ✅"
else
  echo "ℹ️ No progress file — fresh start"
fi
```

---

## 5.0.2 Session Limit

> 🔴 **HARD LIMIT: Máximo 4 epics por sesión.**
>
> Después de 4 epics, el agente DEBE:
>
> 1. Actualizar `backlog-progress.md` con epics completados
> 2. Llamar `notify_user` con `BlockedOnUser: true`
> 3. Informar al usuario: "Continuar en nueva sesión con `/backlog`"
> 4. NO seguir generando

```markdown
📊 Session Limits:

- MAX_EPICS_PER_SESSION = 5
- Si context > 60% → parar aunque no se haya llegado a 5
- Progress file mantiene el estado entre sesiones
```

---

## 5.1 Per-Epic Generation Loop

> 🔴 **Para CADA epic en el plan (full mode) o para el item seleccionado (add mode):**

### Step 5a: Format Reminder (CADA epic)

> 🔴 **ANTES de generar issues, recordar formato.**

```markdown
📝 FORMAT REMINDER (from SKILL §4):

- 🔴 UN ARCHIVO por issue (NUNCA agrupar múltiples issues en un archivo)
- Título: `# PREFIX-NUM: Título`
- Metadata block: Status, Priority, Effort, SP, **Created**, **Started**, **Completed**, Epic, Blocked By, Skills, Agents, **Owner**
- **Created:** YYYY-MM-DD (fecha del día de creación)
- **Started:** — (se llena al ejecutar /implement)
- **Completed:** — (se llena al cerrar con /implement close)
- **Owner:** del Discovery Brief §Team (1 dev → nombre o Tech Lead)
- Descripción: ≥ 3 oraciones (producto + arquitectura)
- User Story: Como P-XXX... + "Implementa: US-XXX"
- 🔴 Doc References: ≥ 2 docs — **CON ANCHOR LINKS** (`#br-xxx`, `#e-xxx`, `#scr-xxx`)
  - ✅ `05_BUSINESS_RULES.md#br-006`
  - ❌ `05_BUSINESS_RULES.md` (SIN anchor = FAIL)
- AC: ≥ 3 checkboxes verificables
- Skills: formato `category/name` (ej: `domains/db`, NO `database-design`)
- 🥒 Gherkin: en español, OBLIGATORIO (≥ 2 escenarios UI, ≥ 1 schema/API)
- Contexto técnico: archivos a crear/modificar EXPLÍCITAMENTE
- ⚠️ Edge Cases: ≥ 1
- 🧪 Tests Requeridos: ≥ 1 (unit/integration/E2E)
- 🚫 Out of Scope: ≥ 1
- Implementa: US-XXX (o "— (infrastructure, §X)" si no hay US)
- 🔴 SK Leverage: OBLIGATORIO (qué del SK reutiliza, o "No aplica")
- 🔴 Implementation Evidence: sección vacía OBLIGATORIA (se llena en /implement)
- 🔴 Commits: sección vacía OBLIGATORIA (se llena en /implement)
- ❌ NO placeholders ({...}, [TODO], TBD)
- ❌ NO heredoc (usar write_to_file)
- ❌ NO agrupar issues en un solo archivo
```

### Step 5b: Plan Stubs (Pasada 1)

Listar issues del epic **SIN IDs**, con título + dependencias + tipo:

```markdown
| #   | Título (stub)          | Depende de   | Tipo             |
| --- | ---------------------- | ------------ | ---------------- |
| ?   | Schema {entidad}       | —            | Schema/Migration |
| ?   | CRUD Actions {entidad} | Schema       | Server Action    |
| ?   | UI {pantalla}          | CRUD Actions | UI View          |
| ?   | 🧪 Epic Tests          | Todos        | Testing          |
```

> Ver SKILL §5 para la tabla de orden por tipo.

### Step 5c: Topological Sort + Assign IDs (Pasada 2)

1. Construir grafo de dependencias desde stubs
2. Topological sort (sin dependencias primero)
3. Desempatar por tipo (SKILL §5: Schema → API → Action → UI → Logic → Polish → Test)
4. Asignar IDs secuenciales: `{PREFIX}-001`, `{PREFIX}-002`, ...
5. **Verificar:** Issue-N NUNCA depende de Issue-M donde M > N
6. Si violación → intercambiar números

### Step 5c.1: On-Demand Tier 2 Loading

> 🟡 **Cargar Tier 2 docs SI el epic los necesita** (ver SKILL §2).

**Si el epic tiene issues de tipo API/integración:**

// turbo

```bash
f=$(ls ./docs/planning/08_*.md 2>/dev/null | head -1)
[ -n "$f" ] && { echo "📄 Tier 2 on-demand: $(basename $f)"; cat "$f"; } || echo "⚠️ 08_API_CONTRACTS.md no encontrado"
```

**Si el epic tiene issue de testing (Step 5.3):**

// turbo

```bash
f=$(ls ./docs/planning/11_*.md 2>/dev/null | head -1)
[ -n "$f" ] && { echo "📄 Tier 2 on-demand: $(basename $f)"; cat "$f"; } || echo "⚠️ 11_TEST_STRATEGY.md no encontrado"
f=$(ls ./docs/planning/12_*.md 2>/dev/null | head -1)
[ -n "$f" ] && { echo "📄 Tier 2 on-demand: $(basename $f)"; cat "$f"; } || echo "⚠️ 12_E2E_SCENARIOS.md no encontrado"
```

### Step 5d.0: Epic Status Check (add mode)

> 📦 **Si estamos agregando un issue a un epic existente, verificar su status.**

1. Leer el status del epic destino en `docs/backlog/{version}/epics/`
2. Si status = `✅ Done`:
   - Cambiar a `🚧 In Progress`
   - Informar: "⚠️ Epic {ID} estaba Done → reabierto a In Progress"
3. Si status ≠ Done → no hacer nada

> ⚠️ En full mode este step se salta (los epics se crean nuevos).

### Step 5d: Materialize Full Issues

> 🔴 **ANTI-GROUPING GATE: Cada issue = 1 archivo .md. NUNCA agrupar.**
> 🔴 **HEREDOC BAN: Usar `write_to_file` tool, NUNCA `cat << 'EOF'`**

**Para CADA issue del epic:**

1. Crear archivo `docs/backlog/M{N}/issues/{PREFIX}-{NUM}-{slug}.md` usando **write_to_file**
2. Usar template de SKILL §4 + `issue.template.md`
3. Llenar TODAS las secciones (no placeholders):
   - Metadata block (Status, Priority, Effort, SP, Created, Started, Completed, Epic, Blocked By, Skills, Agents)
   - Descripción (3-5 oraciones — producto + arquitectura)
   - User Story con P-XXX + "Implementa: US-XXX"
   - Doc References (Inline) ≥ 2 docs para `/implement`
   - AC ≥ 3 checkboxes verificables
   - **🥒 Gherkin en español** (ver regla Gherkin en SKILL §4)
   - Contexto técnico — **archivos a crear/modificar** explícitamente
   - **⚠️ Edge Cases** ≥ 1
   - **🧪 Tests Requeridos** ≥ 1 (unit/integration/E2E)
   - **🚫 Out of Scope** ≥ 1
   - SK Leverage (si aplica)
4. Aplicar resolution algorithm (SKILL §7) para `Skills:` y `Agents:`
5. Asignar prioridad (SKILL §8)

> **Quality mínimos (SKILL §4):**
>
> - Descripción ≥ 3 oraciones
> - AC ≥ 3 items
> - Gherkin ≥ 1 escenario (≥ 2 si UI)
> - Edge Cases ≥ 1
> - Tests ≥ 1
> - Out of Scope ≥ 1
> - Doc References ≥ 2
> - Archivos a crear/modificar listados
> - ❌ NO placeholders ({...}, [TODO], TBD)

### Step 5e: Per-Issue Validation Gate

> 🔴 **HARD GATE — No continuar si falla.**

**Para CADA issue recién creado, verificar:**

- [ ] **1 archivo = 1 issue** (no agrupado)
- [ ] Título correcto: `# PREFIX-NUM: Título`
- [ ] Metadata block completo (12 campos: Status, Priority, Effort, SP, **Created**, **Started**, **Completed**, Epic, Blocked By, Skills, Agents, **Owner**)
- [ ] **Owner** presente (nombre, Tech Lead, o TBD)
- [ ] AC verificables (no genéricos), ≥ 3
- [ ] **Gherkin presente** (≥ 1 escenario; ≥ 2 si UI; skip solo si docs/infra-only)
- [ ] **Edge Cases** sección presente, ≥ 1
- [ ] **Tests Requeridos** sección presente, ≥ 1
- [ ] **Out of Scope** sección presente, ≥ 1
- [ ] **Archivos a crear/modificar** listados en Contexto Técnico
- [ ] Doc references existen, ≥ 2
- [ ] 🔴 **Doc refs usan anchor links** (`#br-xxx`, `#e-xxx`, `#scr-xxx`) — SIN anchor = FAIL
- [ ] Skills usan formato `category/name` (NO bare names como `clean-code` → debe ser `kit/clean-code`)
- [ ] Agents asignados
- [ ] 🔴 **SK Leverage** sección presente (contenido o "No aplica")
- [ ] **Implementation Evidence** sección presente (vacía OK)
- [ ] **Commits** sección presente (vacía OK)
- [ ] No duplica funcionalidad SK
- [ ] Archivo creado con write_to_file (no heredoc)
- [ ] **Created:** presente y es una fecha real `YYYY-MM-DD` (no placeholder, no `—`)
- [ ] **Started:** es `—` (se llena durante /implement)
- [ ] **Completed:** es `—` (se llena durante /implement close)

**Smoke test lifecycle dates (per issue):**

```bash
grep -qF "Created:" "$ISSUE_FILE" && echo "✅ Created present" || echo "🔴 MISSING Created"
grep -qF "Started:" "$ISSUE_FILE" && echo "✅ Started present" || echo "🔴 MISSING Started"
grep -qF "Completed:" "$ISSUE_FILE" && echo "✅ Completed present" || echo "🔴 MISSING Completed"
```

> 🔴 Si falla → corregir ANTES de continuar al siguiente issue.

### Step 5f: Epic Summary + Progress Update

**Después de completar el epic:**

1. **Mostrar progress report:**

```markdown
## ✅ EPIC-{NN}-{NAME} Complete

| Metric         | Value             |
| -------------- | ----------------- |
| Issues creados | [N]               |
| Archivos       | [N] (1 por issue) |
| Story Points   | [SP total]        |
| P0/P1/P2       | [X]/[Y]/[Z]       |
| Dependencies   | [list]            |

→ Continuando con EPIC-{NN+1}...
```

2. **Actualizar progress file:**

> 🔴 **OBLIGATORIO — turbo command, el agente NO puede saltárselo.**

El agente DEBE crear/actualizar `docs/backlog/backlog-progress.md` usando `write_to_file` tool con este contenido (reemplazar placeholders con valores reales):

```
# Backlog Generation Progress
> Auto-generated by /backlog. DO NOT edit manually.
> Last updated: {fecha y hora actual}

## Session Info
- Milestone: M{N}
- Total epics planned: {total del epic plan}
- Epics completed: {cuántos llevan ✅}
- Current session: {número de sesión}

## Epic Plan Status
| EPIC-NN | Nombre | Status | Issues | Session |
| ------- | ------ | ------ | ------ | ------- |
{una fila por cada epic del plan, ✅ si completado, ⬜ si pendiente}

## Next Epic
{nombre del siguiente epic ⬜, o "DONE" si todos ✅}
```

> 🔴 **Si el agente NO crea/actualiza este archivo → GATE FAIL del epic.**

3. **🛑 SESSION LIMIT CHECKPOINT (HARD GATE)**

> 🔴 **Después de CADA epic, el agente DEBE contar epics generados en ESTA sesión.**
> El agente mantiene un contador interno: `SESSION_EPIC_COUNT += 1`

**Si `SESSION_EPIC_COUNT >= 4`:**

El agente DEBE ejecutar **inmediatamente**:

```
ACTION: Call notify_user with:
  BlockedOnUser: true
  ShouldAutoProceed: false
  Message: |
    🛑 Session limit alcanzado (4 epics).

    Progress file actualizado: docs/backlog/backlog-progress.md
    Epics completados: {lista}
    Epics pendientes: {lista}

    Para continuar: abrir NUEVO CHAT y ejecutar /backlog
    El progress file tiene todo para retomar desde EPIC-{next}.
```

> 🔴 **STOP ABSOLUTO.** El agente NO puede generar un 6to epic.
> `notify_user` le quita el control — imposible ignorar.

**Si `SESSION_EPIC_COUNT < 5`:**

→ Continuar con el siguiente epic.

---

## 5.2 Epic File Creation

Para cada epic, crear `docs/backlog/M{N}/epics/EPIC-{NN}-{NAME}.md`:

- Usar `epic.template.md`
- Listar TODOS los issues del epic en la tabla
- Incluir dependencias entre epics
- Incluir scope (incluido / excluido)
- **`Created:` se llena con la fecha del día** (YYYY-MM-DD)
- `Started:` y `Completed:` se dejan como `—`
- **Usar write_to_file** (no heredoc)

**Smoke test epic lifecycle dates:**

```bash
grep -qF "Created:" "$EPIC_FILE" && echo "✅ Epic Created present" || echo "🔴 MISSING Epic Created"
```

---

## 5.3 Testing Issue (OBLIGATORIO por epic)

> 🔴 Cada epic SIEMPRE termina con un issue de testing como **último issue secuencial**.

- Template: `testing-issue.template.md`
- ID: siguiente número secuencial (NO usar 999)
- Cobertura: unit + integration + E2E del epic
- Ver SKILL §10 para detalles
- **1 archivo = 1 testing issue** (como todos los demás)

---

_Generation Complete → Continuar a Phase 6 (Analysis)_
