# Phase 3: Report

> Resumen estructurado y veredicto final.

---

## Verdict Decision Rules (OBLIGATORIO)

> ⚠️ El agente DEBE aplicar estas reglas al determinar el veredicto:

| Condición                       | Verdict                                  |
| ------------------------------- | ---------------------------------------- |
| ANY check con exit 1            | 🔴 NOT READY                             |
| HIGH vuln en deps (producción)  | 🔴 NOT READY                             |
| Secrets encontrados             | 🔴 NOT READY                             |
| R3 multi-agent no ejecutado     | 🔴 NOT READY (R3+)                       |
| R3 critical findings unresolved | 🔴 NOT READY (R3+)                       |
| Coverage < 80% en R4            | 🔴 NOT READY                             |
| Lighthouse no ejecutado en R4   | 🔴 NOT READY (o justificación explícita) |
| Solo warnings (no blockers)     | 🟡 READY WITH WARNINGS                   |
| Todo pasa sin warnings          | ✅ READY                                 |

**NUNCA dar READY o READY WITH WARNINGS si hay un BLOCKER.**

---

## Stop Conditions Matrix

| Condition           | R0  | R1  | R2  | R3  | R4  |
| ------------------- | --- | --- | --- | --- | --- |
| lint fails          | 🟠  | 🟠  | 🔴  | 🔴  | 🔴  |
| typecheck fails     | —   | 🔴  | 🔴  | 🔴  | 🔴  |
| test fails          | —   | 🔴  | 🔴  | 🔴  | 🔴  |
| build fails         | —   | —   | 🔴  | 🔴  | 🔴  |
| secrets found       | —   | —   | 🔴  | 🔴  | 🔴  |
| multi-agent skipped | —   | —   | —   | 🔴  | 🔴  |
| critical findings   | —   | —   | —   | 🔴  | 🔴  |
| coverage < 80%      | —   | —   | 🟠  | 🟠  | 🔴  |
| lighthouse LCP > 4s | —   | —   | —   | —   | 🔴  |

Legend: 🔴 BLOCKER | 🟠 WARNING | — not checked

---

## Report Template

**Mostrar resumen estructurado:**

```md
## 🔍 Audit Summary (R#)

| Check       | Status   | Notes   |
| ----------- | -------- | ------- |
| lint        | ✅/❌    |         |
| typecheck   | ✅/❌    |         |
| test        | ✅/❌    |         |
| build       | ✅/❌    | (R2+)   |
| security    | ✅/❌    | (R2+)   |
| coverage    | XX%      | 80% min |
| multi-agent | ✅/❌/⬜ | (R3+)   |
| e2e         | ✅/❌/⬜ | (R4)    |
| lighthouse  | ✅/❌/⬜ | (R4)    |

**Coverage:** XX% (threshold: 80%)
**Lighthouse LCP:** X.Xs (threshold: 2.5s)

### Multi-Agent Findings (R3+)

| Perspectiva | Veredicto | Hallazgos |
| ----------- | --------- | --------- |
| architect   | ✅/🔴     | ...       |
| security    | ✅/🔴     | ...       |
| backend     | ✅/🔴     | ...       |
| frontend    | ✅/🔴     | ...       |
| quality     | ✅/🔴     | ...       |
| docs        | ✅/🔴     | ...       |
| performance | ✅/🔴     | ...       |

### Blockers

- [list if any - if this section has items, verdict MUST be NOT READY]

### Warnings

- [list if any]

### Verdict

✅ READY / 🟡 READY WITH WARNINGS / 🔴 NOT READY
[Justificación basada en Verdict Decision Rules]
```

---

## If BLOCKER Found

```md
❌ **NOT READY**

### BLOCKERS (must fix before release):

1. [Issue] - [Location] - [Fix]

### Recommended Fix Order:

1. Security issues first
2. Build failures
3. Test failures
4. Coverage gaps
```

---

## If Only Warnings

```md
🟡 **READY WITH WARNINGS**

### Warnings (fix soon):

1. [Issue] - [Location] - [Suggested fix]

### Can proceed with release, but address these in next sprint.
```

---

## If All Pass

```md
✅ **READY**

All checks passed. Approved for release.
```

---

_Report Complete → Audit Finished_
