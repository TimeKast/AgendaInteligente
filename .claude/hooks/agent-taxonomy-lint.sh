#!/usr/bin/env bash
# agent-taxonomy-lint.sh
#
# Valida convención de nomenclatura de agents (ver CLAUDE.md §Convenciones de nomenclatura de agents):
# - Workflow-scoped agents: prefix `{workflow-slug}-*` (ej: `dsc-*`, `imp-*`, `docs-*`, `fx-*`)
# - Generic cross-workflow agents: sin prefix (ej: `architect`, `product-owner`, `project-planner`)
#
# Checks conservadores (no false positives):
#   1. agent-frontmatter-name — `name:` en frontmatter de cada agent matches filename
#   2. prefix-convention      — agents con guion deben tener prefix válido O estar en KNOWN_GENERIC
#   3. dsc-reference-integrity — cada dsc-* agent referenciado en tk-discovery/* existe como file
#
# Severity:
#   🔴 FAIL — frontmatter mismatch, missing dsc-* agent referenced in tk-discovery
#   🟡 WARN — convention issue (agent con guion sin prefix valid)
#
# Usage: ./agent-taxonomy-lint.sh [--strict]
#   --strict: exit 1 en WARN también (default: exit 1 solo en FAIL)

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AGENTS_DIR="$ROOT_DIR/.claude/agents"
SKILLS_DIR="$ROOT_DIR/.claude/skills"

STRICT=false
if [[ "${1:-}" == "--strict" ]]; then
  STRICT=true
fi

# Known workflow prefixes for scoped agents
VALID_PREFIXES=("dsc" "imp" "docs" "fx")

# Generic cross-workflow agents (no prefix expected)
KNOWN_GENERIC=(
  "architect"
  "product-owner"
  "project-planner"
  "quality-engineer"
  "security-auditor"
  "code-archaeologist"
  "ui-critic"
  "skeptical-client"
  "flutter-mobile"
  "claude-code-guide"
  "statusline-setup"
  "Explore"
  "Plan"
  "general-purpose"
  "intake-analyst"
  "kit-analyst"
  "sk-analyst"
)

FAIL_COUNT=0
WARN_COUNT=0

log_fail() { echo "🔴 FAIL: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
log_warn() { echo "🟡 WARN: $1"; WARN_COUNT=$((WARN_COUNT + 1)); }

# Check 1: agent-frontmatter-name
check_frontmatter_name() {
  echo "=== Check 1: agent-frontmatter-name ==="
  for agent_file in "$AGENTS_DIR"/*.md; do
    [[ ! -f "$agent_file" ]] && continue
    local agent_name
    agent_name=$(basename "$agent_file" .md)

    local fm_name
    fm_name=$(awk '/^---$/{f=!f; next} f && /^name:/{print $2; exit}' "$agent_file")

    if [[ -z "$fm_name" ]]; then
      log_fail "Agent '$agent_name' has no frontmatter 'name:' field"
      continue
    fi

    if [[ "$fm_name" != "$agent_name" ]]; then
      log_fail "Agent '$agent_name' frontmatter name='$fm_name' doesn't match filename"
    fi
  done
}

# Check 2: prefix-convention
check_convention() {
  echo "=== Check 2: prefix-convention ==="
  for agent_file in "$AGENTS_DIR"/*.md; do
    [[ ! -f "$agent_file" ]] && continue
    local agent_name
    agent_name=$(basename "$agent_file" .md)

    # Skip generic agents
    if printf '%s\n' "${KNOWN_GENERIC[@]}" | grep -qx "$agent_name"; then
      continue
    fi

    # Check prefix
    local has_valid_prefix=false
    for prefix in "${VALID_PREFIXES[@]}"; do
      if [[ "$agent_name" == "${prefix}-"* ]]; then
        has_valid_prefix=true
        break
      fi
    done

    if [[ "$has_valid_prefix" == "false" ]]; then
      log_warn "Agent '$agent_name' has no valid prefix and isn't in KNOWN_GENERIC. Add prefix OR add to KNOWN_GENERIC in this script."
    fi
  done
}

# Check 3: dsc-reference-integrity
# Only for dsc-* agents since they're the first renamed batch. Looks for references in tk-discovery/*
# that use backtick-quoted agent names, which are our explicit reference convention.
check_dsc_references() {
  echo "=== Check 3: dsc-reference-integrity ==="
  local dsc_refs
  dsc_refs=$(grep -rhoE '`dsc-[a-z][a-z0-9-]+`' "$SKILLS_DIR/tk-discovery" 2>/dev/null | tr -d '`' | sort -u)

  for agent_name in $dsc_refs; do
    local agent_file="$AGENTS_DIR/${agent_name}.md"
    if [[ ! -f "$agent_file" ]]; then
      log_fail "Agent '$agent_name' referenced in tk-discovery skills but NOT found at $agent_file"
    fi
  done
}

# Run checks
check_frontmatter_name
check_convention
check_dsc_references

# Summary
echo ""
echo "=== Summary ==="
echo "🔴 FAIL: $FAIL_COUNT"
echo "🟡 WARN: $WARN_COUNT"

if [[ $FAIL_COUNT -gt 0 ]]; then
  exit 1
fi

if [[ "$STRICT" == "true" && $WARN_COUNT -gt 0 ]]; then
  echo "Strict mode: exiting 1 due to warnings"
  exit 1
fi

echo "✅ Agent taxonomy lint passed"
exit 0
