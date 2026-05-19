# Phase 2.4: R4 Checks (Full Pre-Release)

> **Scope:** Pre-release / breaking changes
> **Tiempo:** ~10m+
> **Incluye:** R0 + R1 + R2 + R3 + e2e + lighthouse + full audit

---

## E2E Tests

// turbo

```bash
echo "🔍 R4: Full Pre-Release Check"
echo "🧪 E2E Tests:"
if grep -q '"test:e2e"' package.json; then
  pnpm test:e2e || echo "❌ E2E tests failed"
else
  echo "⬜ No E2E configured"
fi
```

---

## Lighthouse (OBLIGATORIO)

> ⚠️ Si Lighthouse no se ejecuta, es BLOCKER.

// turbo

```bash
echo "🔦 Lighthouse (OBLIGATORIO):"
if grep -q '"lighthouse"' package.json; then
  # Verificar si servidor está corriendo
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    pnpm lighthouse:assert || pnpm lighthouse || { echo "❌ BLOCKER: Lighthouse failed"; }
  else
    echo "❌ BLOCKER: Lighthouse requiere servidor en http://localhost:3000"
    echo "   Ejecutar 'pnpm dev' primero, o justificar skip explícitamente"
  fi
else
  echo "⚠️ WARNING: Lighthouse no configurado"
  echo "   Agregar a package.json: \"lighthouse\": \"npx lhci autorun\""
  echo "   Para R4, esto degrada a READY WITH WARNINGS (no READY)"
fi
```

---

## Coverage (R4: BLOCKER if < 80%)

// turbo

```bash
if grep -q '"test:coverage"' package.json; then
  echo "📊 Coverage (R4 - BLOCKER threshold):"
  COVERAGE_OUTPUT=$(pnpm test:coverage 2>&1 || true)
  COVERAGE_PCT=$(echo "$COVERAGE_OUTPUT" | grep -E "All files" | grep -oE "[0-9]+(\.[0-9]+)?" | head -1)
  if [ -n "$COVERAGE_PCT" ]; then
    echo "  ${COVERAGE_PCT}%"
    node -e "process.exit(Number(process.argv[1]) < 80 ? 1 : 0)" "$COVERAGE_PCT" \
      && echo "  ✅ Meets 80% threshold" \
      || { echo "  ❌ BLOCKER: Below 80% threshold"; exit 1; }
  else
    echo "  ⬜ Could not parse coverage"
  fi
else
  echo "⬜ test:coverage not configured"
fi
```

---

## INVENTORY Validation

// turbo

```bash
echo "📦 INVENTORY Check:"
if [ -f "./docs/reference/INVENTORY.md" ]; then
  echo "  ✅ INVENTORY.md exists"
  pnpm generate:inventory --check 2>/dev/null || echo "  ⚠️ May be outdated - run 'pnpm generate:inventory'"
else
  echo "  ⚠️ No INVENTORY.md - run 'pnpm generate:inventory'"
fi
```

---

## Docs Audit

// turbo

```bash
echo "📚 Documentation:"
[ -f "README.md" ] && echo "  ✅ README.md" || echo "  ❌ No README.md"
[ -f "CHANGELOG.md" ] && echo "  ✅ CHANGELOG.md" || echo "  ⬜ No CHANGELOG.md"
[ -d "docs" ] && echo "  ✅ docs/ directory" || echo "  ⬜ No docs/"
```

---

## Board Review

// turbo

```bash
if [ -f "./docs/backlog/BOARD.md" ]; then
  echo "📋 Board Status:"
  BLOCKED=$(grep -c "🚫\|Blocked" ./docs/backlog/BOARD.md 2>/dev/null || echo 0)
  [ "$BLOCKED" -gt 0 ] && echo "  ⚠️ $BLOCKED blocked issues" || echo "  ✅ No blocked issues"
fi
```

---

## Bundle Size

// turbo

```bash
if [ -d ".next" ]; then
  echo "📦 Bundle Size:"
  echo "  Total: $(du -sh .next 2>/dev/null | cut -f1)"
  LARGE=$(find .next/static/chunks -name "*.js" -size +500k 2>/dev/null | wc -l)
  [ "$LARGE" -gt 0 ] && echo "  ⚠️ $LARGE chunks > 500KB" || echo "  ✅ No oversized chunks"
fi
```

---

## Knip (Dead Code Detection)

> 🔍 **Detecta:** exports sin uso, dependencias no usadas, archivos huérfanos

// turbo

```bash
echo "🔪 Knip (Dead Code Detection):"
if npx knip --version >/dev/null 2>&1; then
  KNIP_OUTPUT=$(npx knip 2>&1 || true)
  UNUSED_EXPORTS=$(echo "$KNIP_OUTPUT" | grep -c "unused export" || echo 0)
  UNUSED_DEPS=$(echo "$KNIP_OUTPUT" | grep -c "unused dependency" || echo 0)
  UNUSED_FILES=$(echo "$KNIP_OUTPUT" | grep -c "unused file" || echo 0)

  echo "  Unused exports: $UNUSED_EXPORTS"
  echo "  Unused dependencies: $UNUSED_DEPS"
  echo "  Unused files: $UNUSED_FILES"

  TOTAL_UNUSED=$((UNUSED_EXPORTS + UNUSED_DEPS + UNUSED_FILES))
  [ "$TOTAL_UNUSED" -gt 10 ] && echo "  ⚠️ HIGH: Consider cleanup before release" || echo "  ✅ Acceptable level"
else
  echo "  ⬜ Knip not installed (run: npm i -D knip)"
fi
```

---

## Bundle Analyzer (Automated)

> 📊 Runs `pnpm analyze` which builds and reports chunk sizes as text.

// turbo

```bash
echo "📊 Bundle Analyzer:"
if grep -q '"analyze"' package.json; then
  # Already built in R2, just run the script
  node scripts/tools/analyze-bundle.mjs 2>&1
else
  echo "  ⬜ No analyze script configured"
  echo "  Add: \"analyze\": \"next build && node scripts/tools/analyze-bundle.mjs\""
fi

# Heavy dependency check
echo ""
echo "  🔎 Heavy dependency check:"
if [ -f "package.json" ]; then
  grep -q '"moment"' package.json && echo "    ⚠️ moment.js detected - consider date-fns/dayjs"
  grep -q '"lodash"' package.json && echo "    ⚠️ lodash detected - consider lodash-es or native"
  grep -q '"@mui/material"' package.json && echo "    ⚠️ MUI detected - check tree-shaking"
  echo "    ✅ Heavy deps check complete"
fi
```

---

## Git Hygiene

// turbo

```bash
echo "🌿 Git Hygiene:"
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
[ "$UNCOMMITTED" -gt 0 ] && echo "  ⚠️ $UNCOMMITTED uncommitted changes" || echo "  ✅ Clean working tree"
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "no tags")
echo "  Last tag: $LAST_TAG"
```

---

## Pass Criteria (R4)

| Check      | Required      | Blocker if fail? |
| ---------- | ------------- | ---------------- |
| lint       | ✅ Pass       | ❌ in R4         |
| typecheck  | ✅ Pass       | ❌ in R4         |
| test       | ✅ Pass       | ❌ in R4         |
| build      | ✅ Pass       | ❌ in R4         |
| secrets    | ✅ None       | ❌ BLOCKER       |
| coverage   | ≥ 80%         | ❌ BLOCKER in R4 |
| deps       | No HIGH       | ❌ BLOCKER       |
| e2e        | ✅ Pass       | ❌ in R4         |
| lighthouse | LCP < 4s      | ❌ BLOCKER in R4 |
| docs       | README exists | ❌ BLOCKER       |

---

_R4 Complete → Continuar a Report_
