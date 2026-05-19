#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# TimeKast Factory — Pre-commit validation hook for Claude Code
#
# PreToolUse hook on Bash — validates ONLY commits that Claude Code runs via
# the Bash tool. Manual dev commits pass through .husky/pre-commit, not here.
#
# Convention (see .claude/rules/GIT.md §3):
#   - Closes: <ID>[, <ID>...]  → commit closes the issue(s); hook validates
#     Implementation Evidence + ✅ mark in epic for each.
#   - Refs: <ID>               → contextual reference only; hook bypasses.
#   - No keyword               → bypass (WIP/chore/docs commits).
#
# Exit codes:
#   0  → allow commit
#   2  → block commit with message to agent (CC convention)
#
# Fixture mode (testing only):
#   BACKLOG_ROOT env var overrides the search root (default: project/backlog).
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKLOG_ROOT="${BACKLOG_ROOT:-project/backlog}"

# Read hook input from stdin
input=$(cat)

# Extract the full bash command
cmd=$(echo "$input" | jq -r '.tool_input.command // ""')

# Only intercept git commit commands
if ! echo "$cmd" | grep -qE "\bgit ((add [^&]*&& *)+)?commit\b"; then
  exit 0
fi

# ─── Extract Closes: lines from the commit message ───────────────────────────
# The commit message (whether via -m "body" or HEREDOC) lives inside $cmd.
# We match lines that start with optional whitespace + "Closes:" (case-insensitive).
CLOSES_LINES=$(echo "$cmd" | grep -iE '^[[:space:]]*Closes:[[:space:]]*[A-Za-z]+-[0-9]+' || true)

if [ -z "$CLOSES_LINES" ]; then
  # No "Closes:" keyword → bypass (Refs-only, WIP, chore, docs, etc.)
  exit 0
fi

# Extract all PREFIX-NNN tokens from the Closes: line(s). Using grep -oE means
# we don't have to pre-trim shell-quoting junk (trailing quotes, commas,
# parentheses) from the message; we just pull ID-shaped tokens directly.
CLOSES_IDS=$( { echo "$CLOSES_LINES" \
  | grep -oE '[A-Za-z]+-[0-9]+' \
  | tr '[:lower:]' '[:upper:]' \
  | sort -u; } || true )

if [ -z "$CLOSES_IDS" ]; then
  # "Closes:" keyword present but no parseable IDs → bypass defensively
  exit 0
fi

# ─── Validate each ID ────────────────────────────────────────────────────────
for ISSUE_ID in $CLOSES_IDS; do
  # Find the issue file in any milestone under BACKLOG_ROOT
  ISSUE_FILE=$(find "$BACKLOG_ROOT" -type f -path "*/issues/${ISSUE_ID}*.md" 2>/dev/null | head -1 || true)

  if [ -z "$ISSUE_FILE" ]; then
    # ID referenced but no backlog file — allow (external ref or typo)
    continue
  fi

  # Check 1: Implementation Evidence section present
  if ! grep -qF "Implementation Evidence" "$ISSUE_FILE"; then
    echo "🔴 BLOCKED: ${ISSUE_ID} is missing 'Implementation Evidence' section." >&2
    echo "" >&2
    echo "File: $ISSUE_FILE" >&2
    echo "Fix:  Add the Evidence section per phase-6-close.md §6.2 before committing." >&2
    echo "" >&2
    echo "Tip:  If this commit references the issue without closing it, use" >&2
    echo "      'Refs: ${ISSUE_ID}' in the footer instead of 'Closes:'." >&2
    exit 2
  fi

  # Check 2: Epic marks issue as ✅
  # Word-boundary match to avoid false positives (e.g. FX-1 inside FX-10).
  EPIC_FILE=$(grep -lE "(^|[^A-Za-z0-9])${ISSUE_ID}([^0-9]|$)" "$BACKLOG_ROOT"/*/epics/EPIC-*.md 2>/dev/null | head -1 || true)

  if [ -n "$EPIC_FILE" ]; then
    if ! grep -qE "(^|[^A-Za-z0-9])${ISSUE_ID}([^0-9]|$).*✅|✅.*(^|[^A-Za-z0-9])${ISSUE_ID}([^0-9]|$)" "$EPIC_FILE"; then
      echo "🔴 BLOCKED: ${ISSUE_ID} is not marked ✅ in its epic." >&2
      echo "" >&2
      echo "Epic: $EPIC_FILE" >&2
      echo "Fix:  Update the epic's Issues table to mark ${ISSUE_ID} as ✅ (phase-6-close.md §6.3b)." >&2
      echo "" >&2
      echo "Tip:  If this commit references the issue without closing it, use" >&2
      echo "      'Refs: ${ISSUE_ID}' in the footer instead of 'Closes:'." >&2
      exit 2
    fi
  fi
done

# All IDs passed
exit 0
