# CC — Claude Code Runtime Rules

> Reglas del runtime Claude Code (CLI, VSCode extension, desktop). Extiende `CORE.md`.

---

## 1. Routing y anuncio de skills

#### 1.1 Ruteo semántico por `description`

- Ruteo de agents/skills es **semántico** por `description` del frontmatter — único criterio de match
- Cargar skills on-demand (Read) solo cuando haya gap concreto en el razonamiento. Preferir orchestrators (p.ej. `sk-crud-scaffold`) cuando matcheen varias skills del mismo dominio
- `@agent-name` o `/skill-name` explícito del usuario → override semántico

#### 1.2 Anuncio de skill al activarse

> **Trigger binario:** al hacer `Read` de un archivo `SKILL.md`, anunciarla antes de aplicar su guidance.

```
✅ OBLIGATORIO: Si acabas de leer `.claude/skills/*/SKILL.md`, imprimir UNA línea antes de actuar:

   🧰 Aplicando skill `nombre-skill`

✅ Múltiples skills cargadas en la misma tarea:

   🧰 Skills: `skill-a`, `skill-b`, `skill-c`

❌ PROHIBIDO: Aplicar guidance del body de una skill sin anunciarla
❌ PROHIBIDO: Anunciar skills que NO se cargaron (performance theater)
ℹ️  Guidance conocida solo por `description` (sin Read del body) → no anunciar; es routing metadata, no la skill
```

> El harness refuerza la regla con un `PostToolUse` hook en `.claude/hooks/skill-announce-reminder.sh` que inyecta recordatorio al detectar Read de un `SKILL.md`.

---

## 2. Agentes vía Agent tool

```
✅ OBLIGATORIO: Si el dominio matchea un subagent disponible → usarlo con `Agent` + `subagent_type` correcto
✅ Exploración profunda o paralela → `Agent` con `run_in_background`
✅ OBLIGATORIO: Pasar paths explícitos de skills relevantes en el `prompt` del Agent
   call — los subagents NO reciben el listado de skills por `description` injection.
   Sin paths citados, el subagent opera sin el kit (`sk-*`/`kb-*`/`doc-*`).
   Formato: "consulta antes de empezar: .claude/skills/<nombre>/SKILL.md, ..."
❌ PROHIBIDO: Simular persona inline cuando hay subagent disponible
❌ PROHIBIDO: Editar archivos cuando el dominio matchea un agent sin cargarlo — Detectar dominio → cargar agent (Read) → aplicar persona → editar
❌ PROHIBIDO: Invocar subagent sin citar skills relevantes cuando el dominio del task matchea ≥1 skill del kit
```

---

## 3. Plan Mode para HIGH-risk

```
✅ OBLIGATORIO: Entrar en Plan Mode (ExitPlanMode tool) antes de acciones con reversal cost alto:
   - Issue HIGH risk (ver decision-framework)
   - Schema / auth changes
   - Cambios cross-module (3+ archivos críticos)
❌ PROHIBIDO: Proceder sin aprobación en HIGH risk
ℹ️  Git push: autorización explícita por sesión — GIT.md §2
```

---

## 4. Background para tasks largas

```
✅ OBLIGATORIO: `run_in_background=true` para builds, dev servers, tests >30s. CC notifica al terminar; no hacer polling con sleep
```

---

## 5. Permissions (settings.json)

Baseline compartido: `.claude/settings.json` (tracked). Overrides per-dev: `.claude/settings.local.json` (gitignored).

#### 5.1 🔴 PROHIBIDO en `settings.json` tracked

| Patrón prohibido                                                | Regla que lo prohíbe                             |
| --------------------------------------------------------------- | ------------------------------------------------ |
| `Bash(git push *)`                                              | GIT.md §2 (push requiere autorización explícita) |
| `Bash(* --no-verify)` / `* --no-gpg-sign` / `gpgsign=false`     | GIT.md §1                                        |
| `Bash(pnpm db:push *)`                                          | SK.md §1.1                                       |
| `Bash(rm -rf *)` genérico / `rm -rf /`                          | Destructivo, no acotado a cache                  |
| `Bash(git reset --hard *)` / `git checkout .` / `git restore .` | Sobrescribe trabajo local                        |
| Paths absolutos (`/Users/foo/**`, `/home/bar/**`)               | Dev-specific — va a `.local.json`                |
| `Bash(gh api -X POST *)` / `-X DELETE *`                        | Writes a GitHub — prompt explícito               |

**Audit rápido:**

```bash
jq -r '.permissions.allow[]' .claude/settings.json \
  | grep -E '(git push |--no-verify|pnpm db:push|/Users/|/home/|reset --hard|rm -rf (\*|/|~))'
# → debe retornar vacío. Si hay matches → violación del kit.
```

---

## 6. Ontología del kit (mapeo CC)

| Concepto del usuario                                         | Primitiva CC         | Directorio                                                   |
| ------------------------------------------------------------ | -------------------- | ------------------------------------------------------------ |
| **Agent** (proceso invocable con I/O)                        | Subagent             | `.claude/agents/`                                            |
| **Workflow** (pasos, orchestrator)                           | Skill `tk-*`         | `.claude/skills/tk-*/`                                       |
| **Knowledge coding** (cómo, fase código)                     | Skill `kb-*`         | `.claude/skills/kb-*/`                                       |
| **Sistema del Starter Kit** (shipped)                        | Skill `sk-*`         | `.claude/skills/sk-*/`                                       |
| **Knowledge documental** (fase docs/design)                  | Skill `doc-*`        | `.claude/skills/doc-*/`                                      |
| **Workflow interno Factory**                                 | Skill `fx-*`         | `.claude/skills/fx-*/`                                       |
| **Skill project-specific**                                   | Skill `op-*`/`pj-*`  | `.claude/skills/op-*/`                                       |
| **Slash command delgado**                                    | Command              | `.claude/commands/`                                          |
| **Rules**                                                    | Rules via @import    | `.claude/rules/`                                             |
| **Primitiva runtime compartida** (actualmente: `versioning`) | Shared runtime block | `.claude/skills/_shared/*.md` (sin `SKILL.md` — no es skill) |

> **`kb-*` vs `sk-*`:** `kb-*` = patterns para escribir código nuevo (_"¿qué patterns aplico?"_); `sk-*` = sistema shipped por el kit (_"¿cómo me engancho al sistema existente?"_).

---

## 7. 🔴 NUNCA ejecutar procedimientos de memoria

```
❌ PROHIBIDO: Ejecutar un workflow/skill sin Read del archivo fuente en la sesión actual
✅ Si el .md ya está en contexto de esta sesión → no re-leer
```

---

_TimeKast Factory — Claude Code Runtime Rules (L1 Peer)_
