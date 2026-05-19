# Phase 1 — Context Loading

> **Propósito:** Cargar rules on-demand, project references (tiered), y resolver skills/agents hints del issue.
> **Se ejecuta SIEMPRE.**

---

## 1.1 Verify project config (Tier 1)

Las rules always-on (CORE/CODING/GIT/SK/CC/DOR_DOD) y `project/planning/project-config.md` ya están en contexto vía CLAUDE.md `@imports` — no re-leer.

Si este workflow corre en un proyecto derivado sin `project-config.md` (bootstrap temprano), registrar ese gap para CP1 y proceder con defaults del kit.

---

## 1.2 Load Project References (Tiered)

### Tier 1 — TOC for awareness (siempre)

Leer solo las primeras ~30 líneas de cada uno:

- `project/reference/INVENTORY.md` (head 30)
- `project/reference/CODEBASE.md` (head 30)
- `project/reference/HOOKS.md` (head 30)

```bash
echo "📋 INVENTORY (TOC):"
head -30 ./project/reference/INVENTORY.md 2>/dev/null || echo "No INVENTORY.md"
echo ""
echo "📋 CODEBASE (TOC):"
head -30 ./project/reference/CODEBASE.md 2>/dev/null || echo "No CODEBASE.md"
echo ""
echo "📋 HOOKS (TOC):"
head -30 ./project/reference/HOOKS.md 2>/dev/null || echo "No HOOKS.md"
```

### Tier 2 — Full load (condicional)

🟡 **Cargar completo solo si el issue toca código.** Para issues de docs/workflow/scripts → **skip**.

| Doc                           | Cuándo cargar completo                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `INVENTORY.md` full           | Issue crea/modifica componentes                                                                   |
| `CODEBASE.md` full            | Issue modifica archivos existentes                                                                |
| `HOOKS.md` full               | Issue toca hooks, action helpers (`withAuth`/`withSelf`), DB helpers (`auditFields`…), o form kit |
| `design-system` reference     | Issue con UI components (SCR/CMP refs)                                                            |
| `project-structure` reference | Issue crea nuevas rutas o archivos                                                                |

> El agente decide Tier 2 **después** de cargar el issue en Phase 2.

---

## 1.3 Parse Issue-Suggested Skills/Agents Hints

> 🎯 **Hints, no lookups.** Los campos `> **Skills:**` y `> **Agents:**` del issue son advisory — ayudan al matching semántico, no son resolución por registry.

```bash
ISSUE_FILE=$(ls ./project/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)

SKILLS_HINT=$(grep -m1 "^> \*\*Skills:\*\*" "$ISSUE_FILE" 2>/dev/null || echo "")
AGENTS_HINT=$(grep -m1 "^> \*\*Agents:\*\*" "$ISSUE_FILE" 2>/dev/null || echo "")

[ -n "$SKILLS_HINT" ] && echo "🧰 $SKILLS_HINT" || echo "ℹ️  No Skills hint — main loop decide."
[ -n "$AGENTS_HINT" ] && echo "🤖 $AGENTS_HINT" || echo "ℹ️  No Agents hint — main loop decide."
```

**Uso del hint:**

- **Skills hint** (ej: `kb-api`, `sk-api`, `kb-db`, `sk-db`, `kb-ui`, `sk-ui`): consultar con Read si aporta conocimiento específico al issue. CC puede auto-cargar skills por match semántico; el hint refuerza el match. Para pares `kb-*`/`sk-*` (post-KIT-018) considera ambos: `kb-*` responde _"¿qué pattern aplico?"_, `sk-*` responde _"¿cómo me engancho al sistema del kit?"_.
- **Agents hint** (ej: `backend-specialist`, `architect`): el main loop los considera candidatos para delegación en Phase 3/4/5 vía `Agent` tool.

> ⚠️ **No inventar.** Si un hint nombra un skill/agent que no existe, advertir y continuar.

### 🧰 Skill announcement (CC.md §1.2 enforcement)

> 🔴 **MANDATORY** — Para CADA skill efectivamente cargada (por hint del issue o auto-routing semántico), emitir UNA línea ANTES de Phase 2:

```
🧰 Aplicando skill `nombre-skill`
```

Si son múltiples:

```
🧰 Skills: `kb-testing-patterns`, `kb-api`
```

**No anunciar:**

- `tk-implement` (es el workflow mismo, no una skill aplicada)
- Skills listadas en hints pero que no leíste con Read

**Ejemplo literal emitido antes de pasar a Phase 2:**

```
🧰 Aplicando skill `kb-testing-patterns`
```

Si no cargaste ninguna skill de dominio → emitir:

```
ℹ️ No domain skills loaded — main loop procede inline.
```

---

## 1.4 Announce loaded context (CP1 preview)

El agente mantiene mentalmente la lista de lo cargado:

- Project config (si existe)
- INVENTORY/CODEBASE (TOC o full)
- Skills consultadas (si aplica)
- Agents candidatos para delegación

Esta lista se muestra en el bloque **CONTEXT LOADED** del CP1 (ver template literal en `phase-3-plan.md §CP1`).

---

_Phase 1 Complete → Phase 2 (Load Issue)_
