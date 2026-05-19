# Phase 1: Context Loading

> **Propósito:** Cargar SKILL, rules, project refs (tiered), y resolver skills/agents del issue.
> **Se ejecuta SIEMPRE.**

---

## 1.1 Load Knowledge Base (Tier 1 — always)

// turbo

```bash
cat ./.agent/skills/roles/implement/SKILL.md
```

// turbo

```bash
cat ./.agent/rules/DOR_DOD.md 2>/dev/null || echo "No DOR_DOD.md"
cat ./docs/planning/project-config.md 2>/dev/null || echo "No project-config.md"
```

---

## 1.2 Load Project References (Tiered)

> 🟢 Tier 1: Always load (TOC only for awareness)
> 🟡 Tier 2: Conditional based on issue type

### Tier 1: TOC for awareness (always)

// turbo

```bash
echo "📋 INVENTORY (TOC):"
head -30 ./docs/reference/INVENTORY.md 2>/dev/null || echo "No INVENTORY.md"
echo ""
echo "📋 CODEBASE (TOC):"
head -30 ./docs/reference/CODEBASE.md 2>/dev/null || echo "No CODEBASE.md"
```

### Tier 2: Full load only if issue touches code

> 🟡 **Cargar completo solo si el issue toca `app/`, `lib/`, o `components/`.**
> Para issues de docs/workflow/scripts → skip.

```markdown
📝 Tier 2 loading rules:

- INVENTORY full → if issue creates/modifies components or hooks
- CODEBASE full → if issue modifies existing files
- design-system → if issue has UI components (SCR/CMP references)
- project-structure → if issue creates new files/routes
```

**El agente decide si cargar Tier 2 basado en el issue (loaded en Phase 2).**

---

## 1.3 Load Issue-Suggested Skills

> 🎯 **Complete, Not Resolve** — El campo `Skills:` del issue fue generado por `/backlog`
> consultando el REGISTRY. Estos skills son de carga **garantizada**.

// turbo

```bash
ISSUE_FILE=$(ls ./docs/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)
SKILLS_LINE=$(grep -m1 "^> \*\*Skills:\*\*" "$ISSUE_FILE" 2>/dev/null || echo "")

LOADED_SKILLS=""

if [ -n "$SKILLS_LINE" ]; then
  echo "📋 Skills sugeridos por issue:"
  echo "$SKILLS_LINE"
  echo ""

  # Accept domains, kit, project, AND utils categories
  SKILL_NAMES=$(echo "$SKILLS_LINE" | perl -nE 'while(/`([^`]+)`/g){ say $1 }' | grep -E '^(domains|kit|project|utils)/')

  RESOLVED=$(python3 -c "
import yaml, os, sys
r = yaml.safe_load(open('.agent/registry/registry.yaml'))
p = {}
if os.path.exists('.agent/registry/project.yaml'):
    raw = yaml.safe_load(open('.agent/registry/project.yaml'))
    if raw: p = raw
lookup = {}
for cat in ('domains','kit','roles','utils'):
    cat_data = r.get('skills',{}).get(cat,{})
    if isinstance(cat_data, dict):
        for name, info in cat_data.items():
            lookup[f'{cat}/{name}'] = info.get('path','')
for name, info in (p.get('skills',{}) or {}).items():
    if isinstance(info, dict):
        lookup[name] = info.get('path','')
for line in sys.stdin:
    skill = line.strip()
    if not skill: continue
    if skill in lookup and lookup[skill]:
        print(f'{skill}=.agent/{lookup[skill]}')
    else:
        t, n = skill.split('/',1) if '/' in skill else ('kit', skill)
        if t == 'domains': print(f'{skill}=.agent/skills/domains/{n}/SKILL.md')
        elif t == 'project': print(f'{skill}=.agent/skills/project/{n}/SKILL.md')
        elif t == 'utils': print(f'{skill}=.agent/skills/utils/{n}/SKILL.md')
        else: print(f'{skill}=.agent/skills/{n}/SKILL.md')
" <<< "$SKILL_NAMES" 2>/dev/null)

  while IFS='=' read -r skill path; do
    [ -z "$skill" ] && continue
    NAME=$(echo "$skill" | cut -d/ -f2)
    if [ -f "./$path" ]; then
      echo "📦 Loading suggested: ${skill}..."
      cat "./$path" | head -100
      LOADED_SKILLS="${LOADED_SKILLS} ${NAME}"
    else
      echo "⚠️  Skill not found: ${skill} (./${path})"
    fi
  done <<< "$RESOLVED"

  echo "✅ Issue-suggested skills loaded"
  export LOADED_SKILLS
else
  echo "ℹ️  No Skills field in issue — relying on fallback"
fi
```

---

## 1.4 Skill Fallback (only if 1.3 found nothing)

// turbo

```bash
if [ -z "$LOADED_SKILLS" ]; then
  echo "⚠️  No skills from issue — resolving fallback..."

  ISSUE_FILE=$(ls ./docs/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)
  FALLBACK_SKILLS=""

  while IFS='=' read -r key value; do
    case "$key" in
      SKILLS) FALLBACK_SKILLS="$value" ;;
    esac
  done < <(python3 .agent/scripts/registry_cli.py resolve-fallback --issue "$ISSUE_FILE")

  if [ -n "$FALLBACK_SKILLS" ]; then
    echo "📦 Fallback skills: $FALLBACK_SKILLS"
    IFS=',' read -ra SKILL_ARRAY <<< "$FALLBACK_SKILLS"
    for skill in "${SKILL_ARRAY[@]}"; do
      TYPE=$(echo "$skill" | cut -d/ -f1)
      NAME=$(echo "$skill" | cut -d/ -f2)
      if [ "$TYPE" = "domains" ]; then
        SKILL_PATH="./.agent/skills/domains/${NAME}/SKILL.md"
      else
        SKILL_PATH="./.agent/skills/${NAME}/SKILL.md"
      fi
      [ -f "$SKILL_PATH" ] && cat "$SKILL_PATH" | head -100
    done
  fi

  echo "✅ Skill fallback complete"
else
  echo "✅ Skills loaded from issue — no fallback needed"
fi
```

---

## 1.5 Load Agents

> 🤖 **Issue-suggested agents (guaranteed) + test-engineer (conditional)**

// turbo

```bash
ISSUE_FILE=$(ls ./docs/backlog/*/issues/${ISSUE_ID}*.md 2>/dev/null | head -1)
AGENTS_LINE=$(grep -m1 "^> \*\*Agents:\*\*" "$ISSUE_FILE" 2>/dev/null || echo "")

LOADED_AGENTS=""

if [ -n "$AGENTS_LINE" ]; then
  echo "🤖 Agents sugeridos por issue:"
  echo "$AGENTS_LINE"
  echo ""

  for agent in $(echo "$AGENTS_LINE" | perl -nE 'while(/`([^`]+)`/g){ say $1 }'); do
    AGENT_PATH="./.agent/agents/${agent}.md"
    if [ -f "$AGENT_PATH" ]; then
      echo "🤖 Loading: ${agent}..."
      cat "$AGENT_PATH"
      LOADED_AGENTS="${LOADED_AGENTS} ${agent}"
    else
      echo "⚠️  Agent not found: ${agent}"
    fi
  done

  export LOADED_AGENTS
else
  echo "ℹ️  No Agents field — resolving fallback..."

  FALLBACK_AGENTS=""
  while IFS='=' read -r key value; do
    case "$key" in
      AGENTS) FALLBACK_AGENTS="$value" ;;
    esac
  done < <(python3 .agent/scripts/registry_cli.py resolve-fallback --issue "$ISSUE_FILE")

  if [ -n "$FALLBACK_AGENTS" ]; then
    echo "🤖 Fallback agents: $FALLBACK_AGENTS"
    IFS=',' read -ra AGENT_ARRAY <<< "$FALLBACK_AGENTS"
    for agent in "${AGENT_ARRAY[@]}"; do
      AGENT_PATH="./.agent/agents/${agent}.md"
      [ -f "$AGENT_PATH" ] && cat "$AGENT_PATH"
    done
  fi
fi

# Conditional universal: test-engineer only if issue has Tests section or testing ACs
if ! echo "$LOADED_AGENTS" | grep -qw "test-engineer"; then
  if grep -qiE "## .*(Tests|Testing)|test.*unit|test.*e2e|test.*integration" "$ISSUE_FILE" 2>/dev/null; then
    echo "🤖 Loading test-engineer (issue has testing requirements)..."
    cat ./.agent/agents/test-engineer.md
  else
    echo "ℹ️  test-engineer skipped (no testing requirements in issue)"
  fi
fi

echo "✅ Agents loaded"
```

---

_Phase 1 Complete → Continuar a Phase 2 (Load Issue)_
