# Agents Registry

> **Auto-generated** — Agents slice for `/implement`

---

## Catalog (30 agents)

| Agent | Scope | Domains | Priority | Activation |
|-------|-------|---------|----------|------------|
| `architect` | kit | — | 70 | workflow_only |
| `backend-specialist` | kit | api | 80 | auto |
| `code-archaeologist` | kit | — | 60 | workflow_only |
| `data-modeler-drizzle` | kit | db | 75 | auto |
| `database-architect` | kit | db | 80 | auto |
| `dataviz-specialist` | kit | ui | 75 | auto |
| `debugger` | kit | — | 70 | workflow_only |
| `design-engineer` | kit | ui | 75 | auto |
| `design-system-lead` | kit | ui | 65 | explicit_only |
| `devops-engineer` | kit | — | 70 | auto |
| `discovery-expert` | kit | — | 90 | workflow_only |
| `documentation-writer` | kit | — | 65 | workflow_only |
| `explorer-agent` | kit | — | 60 | workflow_only |
| `flutter-mobile` | kit | — | 85 | auto |
| `frontend-specialist` | kit | ui | 80 | auto |
| `game-developer` | kit | — | 70 | explicit_only |
| `layout-composer` | kit | ui | 70 | workflow_only |
| `mobile-developer` | kit | — | 80 | auto |
| `orchestrator` | kit | — | 60 | explicit_only |
| `performance-optimizer` | kit | — | 70 | workflow_only |
| `product-manager` | kit | — | 65 | workflow_only |
| `product-owner` | kit | — | 65 | workflow_only |
| `project-planner` | kit | — | 70 | workflow_only |
| `quality-engineer` | kit | — | 70 | workflow_only |
| `security-auditor` | kit | security | 80 | auto |
| `skeptical-client` | kit | — | 55 | workflow_only |
| `seo-specialist` | kit | — | 65 | workflow_only |
| `test-engineer` | kit | testing | 80 | auto |
| `ui-critic` | kit | ui | 65 | explicit_only |
| `visual-design-director` | kit | ui | 70 | workflow_only |

## Relationships

| Agent | Relationship | Target |
|-------|-------------|--------|
| `data-modeler-drizzle` | narrows | `database-architect` |
| `flutter-mobile` | excludes | `mobile-developer` |
| `design-engineer` | complements | `frontend-specialist` |

---

_Auto-generated from registry.yaml_