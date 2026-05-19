# Checkpoint inline + STOP — Template

<!--
  ===== Cuándo usar este template =====
  CP1 conversational review post-context-load. LOW-MEDIUM risk reversible.
  Inline + STOP es el mecanismo: imprimir el bloque, esperar respuesta del user.

  NO usar este template para CP2 — para synthesis multi-fuente HIGH-risk
  usar `checkpoint-planmode.template.md` (Plan Mode formal).
-->

---

## Compact mode (default)

```markdown
## 🛑 CP{{N}} — {{Nombre del checkpoint}}

### Critical signals (top 3 max)

- {{signal 1 con impacto concreto}}
- {{signal 2}}
- {{signal 3}}

### Plan de continuación

{{1-2 oraciones describiendo Phase N+1..N+K — qué hace cada fase, qué subprocesses corren, qué paralelismo}}.

### Opciones

| #   | Acción                                     |
| --- | ------------------------------------------ |
| 1   | continuar a Phase {{N+1}}                  |
| 2   | ajustar {{X}} antes de continuar           |
| 3   | ahondar en {{Y-id}} (sub-ronda focalizada) |
```

> Esperar respuesta numérica del user (no aceptar "ok" / "sí" / "procede" libres). Si el user responde con texto libre, re-presentar las opciones.

---

## Verbose mode (solo si user declaró `verbose=true` en Phase 0)

```markdown
## 🛑 CP{{N}} — {{Nombre del checkpoint}} (verbose)

### Coverage map (qué se cubrió en las fases anteriores)

| Sección | Estado       | Notas   |
| ------- | ------------ | ------- |
| {{...}} | 🟢 / 🟡 / 🔴 | {{...}} |

### Critical signals

- {{signal 1 expandido con contexto}}
- {{...}}

### Plan detallado de continuación

**Phase {{N+1}}** — {{título}}

- Acciones: {{...}}
- Subprocesses: {{...}}
- Output esperado: {{...}}

**Phase {{N+2}}** — {{...}}

### Invalidation rules (qué triggers re-trabajo de fases anteriores)

- {{trigger 1}} → {{acción}}
- {{trigger 2}} → {{acción}}

¿Procedo, o ajustas algún punto antes?
```

---

## 🔴 Regla de invalidación

Si durante el CP el user aporta info que invalida una fase anterior, regresar a la fase correspondiente ANTES de re-presentar el plan:

- **{{Trigger A}}** → re-ejecutar Phase {{X}} → re-presenta CP
- **{{Trigger B}}** → actualiza scratchpad → re-ejecuta Phase {{Y}}
- **{{Trigger C}}** → resuelve en este CP sin rebote

Solo tras respuesta numérica explícita del user (`1`, `2` o `3`) → siguiente fase. Texto libre (`ok`, `sí`, `procede`) NO cuenta como aprobación; re-presentar las opciones.

---

## Sub-ronda opcional ("3 = ahondar en X")

Cuando el checkpoint cierra batches o sub-procesos, ofrecer:

```
1=continuar / 2=revisar OQs / 3=ahondar en {{X-id}}
```

La opción 3 abre un sub-batch focalizado sin avanzar al siguiente CP. Es flujo normal, no edge case.

---

_TimeKast Factory — checkpoint-inline template (CP1 mecanismo)_
