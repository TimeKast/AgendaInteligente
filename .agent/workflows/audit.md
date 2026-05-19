---
description: Dynamic quality audit - select review level based on scope and risk
---

# /audit — Dynamic Quality Audit

> Actúa como **Quality Engineer** para una auditoría adaptada al nivel de riesgo.
> Este workflow es de **solo lectura** — no modifica archivos, solo audita y reporta.

---

## ⚠️ AGENT ENFORCEMENT RULES

> **IMPORTANTE:** El agente DEBE seguir estas reglas SIN EXCEPCIÓN.

1. **Ejecutar TODOS los comandos del tier seleccionado** - No omitir ningún check
2. **R3 = Multi-agent deep review** - DEBE ejecutar las 7 perspectivas secuencialmente
3. **R4 = TODOS los R2 checks + extras** - No shortcutear
4. **Lighthouse es OBLIGATORIO en R4** - Si no hay servidor, reportar como BLOCKER
5. **Coverage < 80% en R4 = 🔴 NOT READY** - No "READY WITH WARNINGS"
6. **HIGH vuln en deps = 🔴 BLOCKER** - No downgrade a warning
7. **Verdict DEBE alinearse con Stop Conditions Matrix**

---

## 📊 Tier Summary

| Tier | Scope                   | Checks                                      |
| ---- | ----------------------- | ------------------------------------------- |
| R0   | Test gate               | `pnpm test` (unit + integration + E2E)      |
| R1   | Epic/Issue check        | R0 + DoD, AC completitud, ISSUE.md validado |
| R2   | Security + Build        | R1 + build + security scan + deps audit     |
| R3   | Deep Multi-Agent Review | R2 + 7 perspectivas de especialista         |
| R4   | Pre-release             | R3 + lighthouse + knip + bundle-analyzer    |

---

## Phase 0: Context & Agent Loading

// turbo

```bash
cat ./.agent/workflows/audit/context.md
```

---

## Phase 1: Tier Selection

// turbo

```bash
cat ./.agent/workflows/audit/tier-selection.md
```

// turbo

```bash
cat ./.agent/workflows/_shared/checkpoint-transparency.md
```

**🛑 CHECKPOINT: Esperar selección de tier (1-5) o usar shortcut**

---

## Phase 2: Execute Quality Gate

> Cargar fase según tier seleccionado.

### Si R0:

// turbo

```bash
cat ./.agent/workflows/audit/checks-r0.md
```

### Si R1:

// turbo

```bash
cat ./.agent/workflows/audit/checks-r0.md
cat ./.agent/workflows/audit/checks-r1.md
```

### Si R2:

// turbo

```bash
cat ./.agent/workflows/audit/checks-r0.md
cat ./.agent/workflows/audit/checks-r1.md
cat ./.agent/workflows/audit/checks-r2.md
```

### Si R3:

// turbo

```bash
cat ./.agent/workflows/audit/checks-r0.md
cat ./.agent/workflows/audit/checks-r1.md
cat ./.agent/workflows/audit/checks-r2.md
cat ./.agent/workflows/audit/checks-r3.md
```

### Si R4:

// turbo

```bash
cat ./.agent/workflows/audit/checks-r0.md
cat ./.agent/workflows/audit/checks-r1.md
cat ./.agent/workflows/audit/checks-r2.md
cat ./.agent/workflows/audit/checks-r3.md
cat ./.agent/workflows/audit/checks-r4.md
```

---

## Phase 3: Report

// turbo

```bash
cat ./.agent/workflows/audit/report.md
```

---

## Shortcuts

```bash
/audit        # Interactive tier selection
/audit R0     # Quick test gate
/audit R1     # Standard for UI changes
/audit R2     # Deep for API/DB/Auth
/audit R3     # Multi-agent codebase review
/audit R4     # Full pre-release
```

---

## Gates/Escalation

| Trigger                             | Acción                                 |
| ----------------------------------- | -------------------------------------- |
| Fix requiere cambio de arquitectura | Cargar `@[.agent/agents/architect.md]` |
| Security concern encontrado         | Invocar security-auditor               |
| Coverage < 80% sin fix obvio        | Review de testing strategy             |
| Lighthouse LCP > 4s                 | Invocar performance-optimizer          |

---

_TimeKast Factory — Audit Workflow (Modular v2)_
