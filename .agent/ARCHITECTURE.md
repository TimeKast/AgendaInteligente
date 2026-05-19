# TimeKast Template Architecture

> AI-First Development Template powered by Antigravity Kit
>
> **SSOT:** `registry/registry.yaml` — Run `python3 .agent/scripts/registry_cli.py rebuild` to regenerate views

---

## 📋 Overview

TimeKast Template is a comprehensive AI development system consisting of:

```
.agent/
├── rules/               # Mandatory rules (always_on)
├── registry/             # SSOT: registry.yaml + project.yaml + views/
├── agents/               # 29 specialist personas
├── skills/               # 48 skills (domains, kit, roles, universal, utils)
├── workflows/            # Slash commands (/implement, /start, /backlog, etc.)
├── scripts/              # CLI tools (registry_cli.py, checklist.py, etc.)
└── CONTENTS.md           # Full index
```

---

## 🤖 Agents (29)

> **Source:** `registry/views/agents.md` — auto-generated from `registry.yaml`

| Agent                    | Domains  | Key Keywords                           |
| ------------------------ | -------- | -------------------------------------- |
| `architect`              | —        | architecture, ADR, technical decision  |
| `backend-specialist`     | api      | API, endpoint, server action           |
| `code-archaeologist`     | —        | legacy, refactor, archaeology          |
| `data-modeler-drizzle`   | db       | relations, indexes, createTable        |
| `database-architect`     | db       | schema, migration, DB                  |
| `dataviz-specialist`     | ui       | dashboard, chart, graph                |
| `debugger`               | —        | bug, error, debug                      |
| `design-engineer`        | ui       | visual polish, restyle, implement skin |
| `design-system-lead`     | ui       | design system, tokens, theme           |
| `devops-engineer`        | —        | deploy, CI/CD, Vercel                  |
| `discovery-expert`       | —        | discovery, brief, requirements         |
| `documentation-writer`   | —        | documentation, README, docs            |
| `explorer-agent`         | —        | explore, analyze codebase, overview    |
| `flutter-mobile`         | —        | flutter, dart, widget                  |
| `frontend-specialist`    | ui       | component, React, hook                 |
| `game-developer`         | —        | game, canvas, sprite                   |
| `layout-composer`        | ui       | layout, shell, sidebar                 |
| `mobile-developer`       | —        | mobile, React Native, iOS              |
| `orchestrator`           | —        | orchestrate, multi-agent, coordinate   |
| `performance-optimizer`  | —        | performance, slow, bundle              |
| `product-manager`        | —        | product, requirements, stakeholder     |
| `product-owner`          | —        | backlog, prioritization, sprint        |
| `project-planner`        | —        | plan, project, roadmap                 |
| `quality-engineer`       | —        | quality, QC, code review               |
| `security-auditor`       | security | security, auth, RBAC                   |
| `seo-specialist`         | —        | SEO, meta tags, sitemap                |
| `test-engineer`          | testing  | e2e, playwright, integration test      |
| `ui-critic`              | ui       | critique, design review, polish review |
| `visual-design-director` | ui       | visual direction, skin, look and feel  |

---

## 🧠 Skills (48)

> **Source:** `registry/views/skills.md` — auto-generated from `registry.yaml`

### Domains (5)

| Skill              | Description                   |
| ------------------ | ----------------------------- |
| `domains/api`      | API design, REST, GraphQL     |
| `domains/db`       | Database design, schema       |
| `domains/security` | OWASP, vulnerability scanning |
| `domains/testing`  | Testing strategy, E2E         |
| `domains/ui`       | Frontend design, UX patterns  |

### Kit (30)

Core skills available in every project. See `registry/views/skills.md` for full list.

### Roles (7)

Workflow-specific behaviors: backlog generation, design specs, implementation, documentation, etc.

### Universal (5)

Always available: `clean-code`, `plan-writing`, `brainstorming`, `behavioral-modes`, `intelligent-routing`

### Utils (1)

Utility skills: `pdf-export`

---

## 🔄 Workflows

> **Source:** `.agent/workflows/` — invoke with `/command`

### Pipeline Completo

```
/discovery → /proposal → /docs → /design → /backlog → /implement
```

### Key Workflows

| Command      | Description                                              |
| ------------ | -------------------------------------------------------- |
| `/start`     | Router inteligente — registry-powered bilingual matching |
| `/implement` | Execute ONE backlog issue: plan → code → verify → close  |
| `/backlog`   | Generate issues from design docs                         |
| `/design`    | Generate design specification                            |
| `/docs`      | Generate technical documentation                         |
| `/discovery` | Product discovery (v4: 9 phases, deep-dive, SK leverage) |
| `/audit`     | Project audit by type                                    |
| `/debug`     | Systematic bug investigation                             |
| `/test`      | Generate and run tests                                   |
| `/deploy`    | Merge to main (auto-deploy) or full versioned release    |

---

## 🛠️ Scripts (5)

| Script               | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `registry_cli.py`    | Registry management: add, rebuild, validate, resolve-fallback |
| `checklist.py`       | Priority-based project audit                                  |
| `verify_all.py`      | Quick verification suite                                      |
| `session_manager.py` | Session context and state management                          |
| `auto_preview.py`    | Auto-start dev preview server                                 |

---

## � Quick Reference

| Need     | Agent                  | Skills                                          |
| -------- | ---------------------- | ----------------------------------------------- |
| UI/UX    | `frontend-specialist`  | domains/ui, kit/tailwind-patterns               |
| API      | `backend-specialist`   | domains/api, kit/api-patterns                   |
| Database | `data-modeler-drizzle` | domains/db, kit/database-design                 |
| Security | `security-auditor`     | domains/security, kit/vulnerability-scanner     |
| Testing  | `test-engineer`        | domains/testing, kit/webapp-testing             |
| Debug    | `debugger`             | kit/systematic-debugging                        |
| Plan     | `project-planner`      | universal/brainstorming, universal/plan-writing |

---

## 🔗 Registry Views

| View      | Path                          | Content                 |
| --------- | ----------------------------- | ----------------------- |
| Full      | `registry/views/REGISTRY.md`  | Everything              |
| Agents    | `registry/views/agents.md`    | Catalog + relationships |
| Skills    | `registry/views/skills.md`    | All categories          |
| Combos    | `registry/views/combos.md`    | Issue assignment combos |
| Fallbacks | `registry/views/fallbacks.md` | Fallback rules          |

---

_Auto-synced with registry.yaml — Last manual review: 2026-03-18_
