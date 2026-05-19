# Agent Registry

> Single Source of Truth (SSOT) for agent and skill configuration.

---

## Files

| File            | Purpose                          | Editable             |
| --------------- | -------------------------------- | -------------------- |
| `registry.yaml` | Core catalog + policies          | Kit maintainers only |
| `project.yaml`  | Project-specific extensions      | Project developers   |
| `README.md`     | This file — format specification | Kit maintainers only |

---

## Sections in `registry.yaml`

### §A — Catalog

Two top-level keys:

- **`agents`** — 29 agents, each with:

  | Field               | Type     | Required | Description                                                   |
  | ------------------- | -------- | -------- | ------------------------------------------------------------- |
  | `path`              | string   | ✅       | Relative to `.agent/` — must point to existing `.md` file     |
  | `scope`             | enum     | ✅       | `kit` or `project`                                            |
  | `keywords_any`      | string[] | ✅       | Match ANY to activate (English)                               |
  | `keywords_es`       | string[] | ✅       | Match ANY to activate (Spanish)                               |
  | `keywords_all`      | string[] | ❌       | ALL must match — for disambiguation                           |
  | `negative_keywords` | string[] | ✅       | If ANY match, agent is disqualified                           |
  | `domains`           | string[] | ✅       | Associated domains (`ui`, `db`, `api`, `security`, `testing`) |
  | `activation_mode`   | enum     | ✅       | `auto`, `workflow_only`, or `explicit_only`                   |
  | `priority`          | int      | ✅       | 0–100, higher preferred in tie-breaks                         |

- **`skills`** — organized into subcategories:

  | Category    | Count | Routing                 |
  | ----------- | ----- | ----------------------- |
  | `domains`   | 5     | By keywords             |
  | `kit`       | 36    | By keywords             |
  | `roles`     | 6     | By workflow (automatic) |
  | `universal` | 5     | Always loaded           |
  | `utils`     | 1     | On-demand               |

### §B — Routing Policy

Controls how agents and skills are selected:

- **`precedence`** — 6 levels from `user_explicit` (highest) to `fallbacks` (lowest)
- **`scoring`** — point weights for keyword matches
- **`tie_breakers`** — ordered list for equal-score resolution
- **`agent_relationships`** — `narrows`, `excludes`, `complements` between agents
- **`caps`** — max 3 agents, max 5 skills per issue

### §C — Workflow Defaults

8 workflows (`/discovery`, `/proposal`, `/docs`, `/design`, `/backlog`, `/implement`, `/audit_deep`, `/debug`), each defining:

- `agents_always` — unconditionally loaded
- `agents_conditional` — loaded when condition is met:
  - `when.file_exists_any` — check filesystem paths
  - `when.keywords_any` — check issue/request content
  - `when.file_count_gt` — check affected file count
- `agents_by_tier` — loaded based on tier level (for `/audit_deep`)
- `skills_always` — unconditionally loaded

### §D — Issue Assignment Combos

12+ predefined combos for `/backlog` issue generation. Each has:

- `match.any` / `match.all` — keyword triggers
- `dimension` — domain classification (`ui`, `db`, `security`, `infra`, `testing`, `api`)
- `agents` / `skills` — what to assign

Plus `resolution_algorithm` (8 steps) for processing matches.

### §E — Fallback Policy

Two-step safety net:

1. **Contextual** — 5 domain detectors (db, security, testing, deploy, docs)
2. **Generic** — fullstack pair (`frontend-specialist` + `backend-specialist`)

Agents and skills are evaluated **independently** (`independent: true`).

---

## `project.yaml` — Extension Rules

### Allowed

- Add new agents (namespaced `project/`)
- Add new skills (namespaced `project/`)
- Add new `issue_combos` entries

### Forbidden

- Modify core precedence rules
- Modify `workflow_defaults`
- Modify `fallback_policy`
- Override core agent/skill definitions

### Interaction Modes

| Mode         | Behavior                                     |
| ------------ | -------------------------------------------- |
| `complement` | Loads alongside target, doesn't replace      |
| `override`   | Replaces target when project agent matches   |
| `exclude`    | If project agent loads, target does NOT load |

### Merge Order

1. Load `registry.yaml` (core)
2. Load `project.yaml` (if exists)
3. Validate `project/` namespace
4. Merge project entries into in-memory catalog
5. Generate views from merged data
6. Apply precedence (project = level 4)

---

## Validation

```bash
# Parse check
python3 -c "import yaml; yaml.safe_load(open('.agent/registry/registry.yaml')); print('✅ Valid')"

# All paths exist
python3 -c "
import yaml, os
r = yaml.safe_load(open('.agent/registry/registry.yaml'))
ok = True
for k,v in r['agents'].items():
    if not os.path.exists('.agent/' + v['path']):
        print(f'❌ {k}: {v[\"path\"]}'); ok = False
for cat in ['domains','kit']:
    for k,v in r['skills'].get(cat,{}).items():
        if not os.path.exists('.agent/' + v['path']):
            print(f'❌ {cat}/{k}: {v[\"path\"]}'); ok = False
if ok: print('✅ All paths exist')
"
```

---

## Consuming the Registry

| Consumer            | What it reads                               | How                                            |
| ------------------- | ------------------------------------------- | ---------------------------------------------- |
| `/backlog`          | `REGISTRY.combos.md` + `REGISTRY.agents.md` | Generated views                                |
| `/implement`        | Issue `Agents:` / `Skills:` fields directly | Only `REGISTRY.fallbacks.md` if fields missing |
| `/init`             | `REGISTRY.md`                               | Full human-readable view                       |
| `build_registry.py` | `registry.yaml` + `project.yaml`            | Generates all `.md` views                      |
| `lint_registry.py`  | `registry.yaml`                             | Validates paths, duplicates, format            |

---

_TimeKast Factory — Agent Registry Format Specification_
