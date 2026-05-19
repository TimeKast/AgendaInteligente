# 📚 Agent System Contents

> Índice central del sistema de agentes TimeKast Factory.
> **Ubicación:** `.agent/CONTENTS.md`

---

## 📁 Estructura

```
.agent/
├── CONTENTS.md          # Este archivo - índice central
├── rules/               # Reglas absolutas
│   ├── 00_global.md        # Reglas universales (kit)
│   ├── 04_complementary.md # Reglas complementarias Factory
│   ├── GEMINI.md          # Meta-rules del kit
│   ├── HIERARCHY.md       # Jerarquía docs + skills
│   ├── ROUTING.md         # Routing de agentes + file awareness
│   └── DOR_DOD.md         # Definition of Ready/Done
├── workflows/           # Flujos ejecutables
│   ├── init.md            # Inicializar sesión
│   ├── start.md           # Router inteligente de requests
│   ├── discovery/         # Entender problema (v4: 9 fases)
│   ├── proposal/          # Propuesta cliente
│   ├── docs/              # Documentación técnica
│   ├── design/            # Especificación UI/UX
│   ├── backlog/           # Generar issues
│   ├── implement/         # Ejecutar issues
│   ├── audit.md           # Auditoría rápida por tipo
│   ├── audit_deep/        # Quality audit R0-R4
│   ├── validate_docs/     # Validación docs pipeline
│   └── _shared/           # Bloques reutilizables
│       ├── context-check.md    # Context health check
│       └── doc-versioning.md   # Document versioning pattern
├── skills/              # Conocimiento especializado
│   ├── roles/             # Por flujo de trabajo
│   ├── domains/           # Por stack técnico
│   ├── utils/             # Utilidades (pdf-export, etc.)
│   └── (kit skills)       # 36 skills del Antigravity Kit
└── agents/              # Personas especializadas
```

---

## 🚀 Workflows Disponibles

| Workflow   | Comando               | Input           | Output                                              |
| ---------- | --------------------- | --------------- | --------------------------------------------------- |
| Init       | `/init`               | —               | Context cargado                                     |
| Start      | `/start`              | Request         | Respuesta especializada                             |
| Discovery  | `/discovery`          | Idea/problema   | `00_DISCOVERY_BRIEF.md` (v4: multi-pass, deep-dive) |
| Proposal   | `/proposal`           | Discovery Brief | `01_PROPOSAL.md`                                    |
| Docs       | `/docs`               | Proposal        | `02-14_*.md`                                        |
| Design     | `/design`             | Docs 02-14      | `15_DESIGN.md`                                      |
| Backlog    | `/backlog`            | Design 15       | Issues en backlog                                   |
| Implement  | `/implement ISSUE-ID` | Issue ID        | Código + tests                                      |
| Audit      | `/audit`              | Tipo            | Auditoría rápida                                    |
| Audit Deep | `/audit_deep R0-R4`   | Tier level      | QC Report                                           |
| Validate   | `/validate_docs V1-3` | Tier level      | Validation Report                                   |
| Park       | `/park "idea"`        | Descripción     | `PARK-XXX.md`                                       |
| Debug      | `/debug "error"`      | Descripción bug | Fix + commit                                        |
| Deploy     | `/deploy`             | —               | Merge a main (auto-deploy)                          |
| Deploy     | `/deploy release`     | —               | Version bump + tag + merge                          |

### Pipeline Completo

```
Proyectos estructurados:
/discovery → /proposal → /docs → /design → /backlog → /implement → /deploy

Fixes rápidos:
/debug → fix → commit (sin issue formal) → /deploy

Validación cruzada:
/validate_docs (después de cada fase del pipeline)
```

---

## 🎭 Agents & Skills

> **SSOT:** `.agent/registry/registry.yaml` (30 agents, 48 skills)
>
> Para detalle completo: `.agent/registry/views/REGISTRY.md`
> Gestión: `python3 .agent/scripts/registry_cli.py rebuild|validate`

| Vista     | Path                          | Contenido                          |
| --------- | ----------------------------- | ---------------------------------- |
| Full      | `registry/views/REGISTRY.md`  | Agents + Skills + Routing + Combos |
| Agents    | `registry/views/agents.md`    | Catalog + relationships            |
| Skills    | `registry/views/skills.md`    | Domains + Kit skills               |
| Combos    | `registry/views/combos.md`    | Issue assignment combos            |
| Fallbacks | `registry/views/fallbacks.md` | Fallback rules                     |

---

## 📖 Cómo Cargar Context On-Demand

### Cargar un skill específico:

```bash
cat ./.agent/skills/domains/api/SKILL.md
```

### Cargar un agente:

```bash
cat ./.agent/agents/architect.md
```

### Cargar reglas:

```bash
cat ./.agent/rules/04_complementary.md
```

---

## 🔗 Referencias Rápidas

| Necesito...            | Documento                                |
| ---------------------- | ---------------------------------------- |
| Reglas complementarias | `rules/04_complementary.md`              |
| Jerarquía de autoridad | `rules/HIERARCHY.md`                     |
| DoR/DoD checklists     | `rules/DOR_DOD.md`                       |
| Issue template         | `skills/roles/backlog/issue.template.md` |
| Epic template          | `skills/roles/backlog/epic.template.md`  |

---

_TimeKast Factory — Agent System Index_
