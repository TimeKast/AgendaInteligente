# Phase 2.2: R2 Checks (Deep)

> **Scope:** DB/Auth/API changes
> **Tiempo:** ~5m
> **Incluye:** R0 + R1 + build + security + coverage

---

## Build Check

// turbo

```bash
echo "🔍 R2: Deep Check"
pnpm build
```

---

## Dependency Audit

// turbo

```bash
echo "📦 Dependency Audit:"
pnpm audit --audit-level=high || exit 1
pnpm audit --audit-level=moderate || echo "⚠️ Moderate+ vulns exist (review output)"
pnpm outdated || true
```

---

## Security Scan

// turbo

```bash
echo "🔒 Secrets Scan:"
SECRETS=$(rg -n "sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza|ghp_|gho_" . --glob '!node_modules' --glob '!.git' 2>/dev/null | wc -l)
if [ "$SECRETS" -gt 0 ]; then
  echo "❌ BLOCKER: $SECRETS potential secrets found!"
  rg -n "sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza|ghp_|gho_" . --glob '!node_modules' --glob '!.git' 2>/dev/null | head -10
  exit 1
else
  echo "✅ No secrets detected"
fi
```

---

## TSConfig Check

// turbo

```bash
echo "📝 TypeScript Config:"
if [ -f "tsconfig.json" ]; then
  grep -q '"strict": true' tsconfig.json && echo "  ✅ strict: true" || echo "  ⚠️ strict: NOT enabled"
  grep -q '"skipLibCheck": true' tsconfig.json && echo "  ⬜ skipLibCheck: true" || echo "  ✅ skipLibCheck: false"
else
  echo "  ❌ No tsconfig.json"
fi
```

---

## Environment Validation

// turbo

```bash
echo "🔐 Environment:"
[ -f ".env.example" ] && echo "  ✅ .env.example exists" || echo "  ⚠️ No .env.example"
grep -q "\.env" .gitignore 2>/dev/null && echo "  ✅ .env in .gitignore" || echo "  ❌ .env NOT in .gitignore!"
```

---

## Coverage Check (80% threshold)

// turbo

```bash
if grep -q '"test:coverage"' package.json; then
  echo "📊 Coverage Analysis:"
  COVERAGE_OUTPUT=$(pnpm test:coverage 2>&1 || true)
  COVERAGE_PCT=$(echo "$COVERAGE_OUTPUT" | grep -E "All files" | grep -oE "[0-9]+(\.[0-9]+)?" | head -1)
  if [ -n "$COVERAGE_PCT" ]; then
    echo "  Coverage: ${COVERAGE_PCT}%"
    node -e "process.exit(Number(process.argv[1]) < 80 ? 1 : 0)" "$COVERAGE_PCT" \
      && echo "  ✅ Meets 80% threshold" \
      || echo "  ⚠️ Below 80% threshold"
  else
    echo "  ⬜ Could not parse coverage %; check output manually"
  fi
else
  echo "⬜ test:coverage not configured"
fi
```

---

## @ui-critic Design System Compliance

> 🎨 **Conditional:** Only runs if the changeset includes UI files.
> Loads agent `@ui-critic` for Part 1 (Compliance) only.

// turbo

```bash
UI_FILES=$(git diff --name-only HEAD~5 2>/dev/null | grep -E "\.(tsx|css)$" | grep -vE "test\." | head -20)

if [ -z "$UI_FILES" ]; then
  echo "⬜ No UI files in changes — skipping @ui-critic"
else
  echo "🎨 @ui-critic Design System Compliance Check"
  echo ""
  echo "📋 UI files to audit:"
  echo "$UI_FILES" | while read f; do echo "  - $f"; done
  echo ""

  # DS1: Hardcoded colors (hex literals in TSX, not in CSS variable definitions)
  echo "🔍 DS1 — Hardcoded Colors:"
  HARDCODED_COLORS=$(echo "$UI_FILES" | xargs grep -nE "#[0-9a-fA-F]{3,8}[^a-zA-Z]|rgb\(|hsl\(" 2>/dev/null | grep -v "var(--" | grep -v "// token" | grep -v ".css:" | head -10)
  if [ -n "$HARDCODED_COLORS" ]; then
    echo "  🔴 Potential hardcoded colors found:"
    echo "$HARDCODED_COLORS" | while read line; do echo "    $line"; done
  else
    echo "  ✅ No hardcoded colors detected"
  fi
  echo ""

  # DS6: Generic framework utilities when custom tokens exist
  echo "🔍 DS6 — Framework Token Override:"
  echo "  ℹ️ Agent @ui-critic should verify custom tokens are used over framework defaults"
  echo "  ℹ️ Load design-system-principles skill for DS6 check details"
  echo ""

  echo "📝 Full @ui-critic review (Part 1 + Part 2) recommended for comprehensive audit"
  echo "   Load agent: @ui-critic with skills design-system-principles, design-engineering"
fi
```

---

## Pass Criteria

| Check     | Required   | Status                                    |
| --------- | ---------- | ----------------------------------------- |
| lint      | ✅ Pass    | (from R0)                                 |
| typecheck | ✅ Pass    | (from R1)                                 |
| test      | ✅ Pass    | (from R1)                                 |
| build     | ✅ Pass    |                                           |
| secrets   | ✅ None    | BLOCKER if found                          |
| coverage  | 🟠 ≥ 80%   | Warning if below                          |
| deps      | 🟠 No HIGH | BLOCKER if HIGH vuln                      |
| ui-critic | 🟠 If UI   | WARNING if DS violations (BLOCKER at R3+) |

---

_R2 Complete → Continuar a Report (o R3 si aplica)_
