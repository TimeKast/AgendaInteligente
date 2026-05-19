---
description: Manage the agent/skill registry — add entries, rebuild views, validate integrity
---

# /factory_agents — Registry Management

> **Purpose:** Manage agents and skills in the registry.
> **Modes:** `add` | `rebuild` | `validate` | `backfill`
> **Script:** `.agent/scripts/registry_cli.py` (add/rebuild/validate)
> **Backfill:** Agent-driven — same 8-step algorithm as `/backlog`

---

## Mode Detection

| Command                     | Mode        | Purpose                        |
| --------------------------- | ----------- | ------------------------------ |
| `/factory_agents add`       | Add         | Create or register agent/skill |
| `/factory_agents rebuild`   | Rebuild     | Regenerate views from YAML     |
| `/factory_agents validate`  | Validate    | Check registry integrity       |
| `/factory_agents backfill`  | Backfill    | Re-evaluate issues from combos |
| `/factory_agents` (no args) | Interactive | Ask which mode                 |

---

## Mode 1: Add

> Interactive flow — the agent asks questions, then invokes registry_cli.py.

### Step 1: Determine Action

Ask the user:

```
¿Qué quieres hacer?
1. Crear nuevo agent/skill (scaffold + registrar)
2. Registrar uno existente (ya tiene archivo .md)
```

### Step 2: Determine Type

```
¿Qué tipo?
1. Agent
2. Skill
```

### Step 3: Determine Scope

```
¿Scope?
1. Kit (global — disponible en todos los proyectos)
2. Project (solo este proyecto — namespace project/)
```

### Step 4: Gather Information

**For agents:**

- Name (kebab-case): `--name`
- Keywords EN (comma-separated): `--keywords`
- Keywords ES (comma-separated): `--keywords-es`
- Negative keywords: `--negative` (optional)
- Domain (ui/db/api/security/testing): `--domain` (optional)
- Priority (0-100, default 70): `--priority`
- Description: `--description`

**For skills:**

- Name (kebab-case): `--name`
- Category (domains/kit/roles/utils): `--category`
- Keywords EN: `--keywords`
- Keywords ES: `--keywords-es`
- Description: `--description`

### Step 5: Execute

**Create new:**

// turbo

```bash
python3 .agent/scripts/registry_cli.py add-agent \
  --name "${NAME}" \
  --scope "${SCOPE}" \
  --keywords "${KEYWORDS}" \
  --keywords-es "${KEYWORDS_ES}" \
  --domain "${DOMAIN}" \
  --priority ${PRIORITY} \
  --description "${DESCRIPTION}"
```

or

// turbo

```bash
python3 .agent/scripts/registry_cli.py add-skill \
  --name "${NAME}" \
  --category "${CATEGORY}" \
  --scope "${SCOPE}" \
  --keywords "${KEYWORDS}" \
  --keywords-es "${KEYWORDS_ES}" \
  --description "${DESCRIPTION}"
```

**Register existing:**

// turbo

```bash
python3 .agent/scripts/registry_cli.py register \
  --path "${PATH}" \
  --scope "${SCOPE}" \
  --keywords "${KEYWORDS}" \
  --keywords-es "${KEYWORDS_ES}"
```

### Step 6: Post-Add (Kit Only)

If scope=kit, offer push via npx:

```
📦 ¿Quieres publicar este cambio al Agent Kit?

npx @timekast/agentes-edmond --push --patch --message "Add agent: ${NAME}"

1. Sí, publicar
2. No, solo local
```

### Step 7: Verify

The CLI auto-runs `rebuild` + `validate` after add.
Show the user the validation output.

---

## Mode 2: Rebuild

> Regenerate all view files from registry.yaml (+project.yaml if exists).

// turbo

```bash
python3 .agent/scripts/registry_cli.py rebuild
```

**Output:** 5 view files in `.agent/registry/views/`:

| View           | Purpose                       | Consumer        |
| -------------- | ----------------------------- | --------------- |
| `REGISTRY.md`  | Full human-readable           | Humans, `/init` |
| `agents.md`    | Agent catalog + relationships | `/implement`    |
| `skills.md`    | Skills (domains + kit)        | `/backlog`      |
| `combos.md`    | Issue combos                  | `/backlog add`  |
| `fallbacks.md` | Fallback rules                | `/implement`    |

---

## Mode 3: Validate

> Lint registry integrity — errors vs warnings.

// turbo

```bash
python3 .agent/scripts/registry_cli.py validate
```

For strict mode (blocks on errors):

```bash
python3 .agent/scripts/registry_cli.py validate --strict
```

### Errors (❌) — block `--strict`

| Error                     | Description                                    |
| ------------------------- | ---------------------------------------------- |
| Path not found            | Agent/skill in registry but file doesn't exist |
| Invalid ref in combo      | Agent/skill referenced in combo doesn't exist  |
| Invalid ref in workflow   | Agent referenced in workflow doesn't exist     |
| Invalid project namespace | Project entry without `project/` prefix        |

### Warnings (⚠️) — report but don't block

| Warning              | Description                              |
| -------------------- | ---------------------------------------- |
| Keyword overlap >80% | Two agents share >80% keywords           |
| Orphan file          | File exists but no registry entry        |
| Unused entry         | Entry not referenced in combos/workflows |

---

## Mode 4: Backfill (Agent-Driven)

> Re-evaluate `Skills:` and `Agents:` on existing issues using the **same 8-step resolution algorithm** as `/backlog`.
> El agente lee cada issue con comprensión completa y aplica la misma lógica — sin scripts intermediarios.

### Step 1: Load Registry Context

> 🔴 **Cargar EXACTAMENTE el mismo contexto que `/backlog` carga en §3.2.**

// turbo

```bash
cat ./.agent/registry/views/combos.md 2>/dev/null || echo "No combos view — run: python3 .agent/scripts/registry_cli.py rebuild"
```

### Step 2: Scope Selection & Issue Listing

**El agente DEBE preguntar scope antes de listar:**

```
¿Qué quieres re-evaluar?
1. Todo el backlog activo (última versión, excluyendo ✅ Completed)
2. Un milestone/versión específico (ej: v4.2, MVP)
3. Un epic específico (ej: EPIC-REGISTRY)
4. Un issue específico (ej: REG-014)
```

// turbo

```bash
echo "📂 Versiones disponibles:"
for d in ./docs/backlog/*/; do
  VERSION=$(basename "$d")
  TOTAL=$(ls "$d"issues/*.md 2>/dev/null | wc -l | tr -d ' ')
  COMPLETED=$(grep -rl "✅ Completed\|✅ Done" "$d"issues/*.md 2>/dev/null | wc -l | tr -d ' ')
  PENDING=$((TOTAL - COMPLETED))
  echo "  $VERSION: $TOTAL issues ($PENDING pending, $COMPLETED completed)"
done
echo ""
echo "📁 Epics disponibles:"
for d in ./docs/backlog/*/epics/*.md 2>/dev/null; do
  EPIC=$(basename "$d" .md)
  echo "  $EPIC"
done 2>/dev/null || echo "  (no epics found)"
```

**After user selects scope, list matching issues (skip ✅ Completed):**

// turbo

```bash
# Adjust VERSION and FILTER based on user selection
VERSION="${SELECTED_VERSION:-$(ls -d ./docs/backlog/v*/ ./docs/backlog/M*/ 2>/dev/null | sort -V | tail -1 | xargs basename 2>/dev/null || echo 'none')}"

if [ "$VERSION" != "none" ]; then
  echo "📋 Issues pendientes en $VERSION:"
  echo ""
  SKIP=0
  SHOW=0
  for f in ./docs/backlog/${VERSION}/issues/*.md; do
    if grep -q "✅ Completed\|✅ Done" "$f" 2>/dev/null; then
      SKIP=$((SKIP + 1))
      continue
    fi
    ID=$(grep -m1 "^# " "$f" | sed 's/# //' | cut -d: -f1)
    if [ -n "$EPIC_FILTER" ]; then
      echo "$ID" | grep -qi "$EPIC_FILTER" || continue
    fi
    CURRENT_SKILLS=$(grep -m1 "^\\*\\*Skills:\\*\\*\\|^> \\*\\*Skills:\\*\\*" "$f" | head -1)
    CURRENT_AGENTS=$(grep -m1 "^\\*\\*Agents:\\*\\*\\|^> \\*\\*Agents:\\*\\*" "$f" | head -1)
    echo "### $ID"
    echo "  ${CURRENT_SKILLS:-⚠️ No Skills field}"
    echo "  ${CURRENT_AGENTS:-⚠️ No Agents field}"
    echo ""
    SHOW=$((SHOW + 1))
  done
  echo "📊 Total: $SHOW pending | $SKIP skipped (completed)"
fi
```

### Step 3: For Each Issue — Apply Resolution Algorithm

> 🔴 **OBLIGATORIO:** Leer el issue completo y aplicar los **mismos 8 pasos** de `/backlog generation.md` §3.2.
> **NO** usar scripts Python. **NO** simplificar la lógica. Misma resolución, misma comprensión.

**El agente DEBE para cada issue:**

1.  **Leer** el issue completo (`cat ./docs/backlog/.../issues/ISSUE-ID.md`)
2.  **Aplicar** el resolution algorithm de 8 pasos:

> **Step 1 — detect_matching_combos:** Buscar en `combos.md` TODOS los combos cuyos keywords matcheen con el contenido del issue.
>
> **Step 2 — select_primary_combo:** Del set matcheado, elegir el combo con mayor relevancia (más keywords matcheados). Este es el combo primario.
>
> **Step 3 — allow_one_complement:** Si matchearon combos de la MISMA dimensión → tomar SOLO el primario.
> Si matchearon combos de DIFERENTES dimensiones → permitir máximo 1 combo complementario (diferente `dimension`).
>
> | Ejemplo         | Combos                        | Dimensiones    | Resultado                          |
> | --------------- | ----------------------------- | -------------- | ---------------------------------- |
> | ✅ Aceptable    | `ui_crud` + `schema_db`       | ui + db        | 2 combos (diferentes dimensiones)  |
> | ❌ No permitido | `ui_crud` + `ui_visual`       | ui + ui        | Solo el primario (misma dimensión) |
> | ✅ Aceptable    | `auth_rbac` + `server_action` | security + api | 2 combos (diferentes dimensiones)  |
>
> **Step 4 — enrich_via_scoring:** Revisar `skills.md` para agregar skills adicionales por domain match (+10 por keyword, +15 por domain).
>
> **Step 5 — apply_agent_relationships:** Aplicar reglas de `agents.md` (Relationships):
>
> - `narrows` → preferir el más específico (ej: `data-modeler-drizzle` > `database-architect` si drizzle presente)
> - `excludes` → nunca cargar ambos (ej: `flutter-mobile` excluye `mobile-developer`)
> - `complements` → pueden coexistir (ej: `test-engineer` + `backend-specialist`)
>
> **Step 6 — dedupe:** Eliminar duplicados, ordenar alfabéticamente.
>
> **Step 7 — apply_caps:** max 3 agents, max 5 skills por issue.
>
> **Step 8 — compare_and_report:** Comparar resultado nuevo vs lo que el issue tiene actualmente.

3.  **Registrar** si cambió o no.

> 🔴 **VALIDACIÓN:** Todo issue DEBE tener ≥ 1 skill + ≥ 1 agent. Si ningún combo matchea → fallback: `domains/api` + `domains/ui` y `backend-specialist` + `frontend-specialist`.

### Step 4: Show Diff Report

**Después de evaluar TODOS los issues en scope, mostrar reporte consolidado:**

```markdown
## 📊 Backfill Report

| Issue   | Current Skills | → Suggested Skills           | Current Agents        | → Suggested Agents                       | Changed? |
| ------- | -------------- | ---------------------------- | --------------------- | ---------------------------------------- | -------- |
| XXX-001 | `domains/ui`   | `domains/ui`, `kit/tailwind` | `frontend-specialist` | `frontend-specialist`, `design-engineer` | ✅ YES   |
| XXX-002 | `domains/api`  | `domains/api`                | `backend-specialist`  | `backend-specialist`                     | ⏭️ NO    |
```

### Step 5: Apply (Only with Confirmation)

**El agente DEBE preguntar antes de aplicar:**

```
¿Aplicar cambios?
1. Aplicar todos (N issues cambiarían)
2. Aplicar selectivo (elegir cuáles)
3. Cancelar
```

🛑 **NUNCA aplicar sin confirmación explícita.**

Para aplicar, el agente actualiza las líneas `> **Skills:**` y `> **Agents:**` directamente en cada issue .md.

---

## Project-Specific Support

### Structure

```
.agent/
├── agents/project/          # ← project-specific agents
│   ├── .gitkeep
│   └── {name}.md
├── skills/project/  # ← project-specific skills
│   ├── .gitkeep
│   └── {name}/SKILL.md
└── registry/
    ├── project.yaml         # ← project extensions
    └── ...
```

### Rules

- All project entries MUST use `project/` namespace prefix
- `project.yaml` CAN add: agents, skills, issue_combos
- `project.yaml` CANNOT modify: core precedence, workflow_defaults, fallback_policy
- Interaction modes: `complement`, `override`, `exclude`

### Factory Release Exclusions

The following are excluded from `develop → main` merge:

- `agents/project/`
- `skills/project/`
- `project.yaml`

---

## Role Skill

> Scaffold templates and interactive flow guide:
> `.agent/skills/roles/factory_agents/SKILL.md`

---

_TimeKast Factory — Registry Management Workflow_
