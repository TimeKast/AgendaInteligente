# Phase 0: Mode Detection + Context Status

> **Propósito:** Detectar modo y mostrar estado del contexto.
> **Sin carga de datos** — solo detección y status.

---

## 0.1 Context Status (MANDATORY)

> 🔴 **MANDATORY OUTPUT — NO SKIP**

// turbo

```bash
cat ./.agent/workflows/_shared/context-check.md
```

**Enforcement:**

- 🟢 → Continuar a §0.2 Mode Detection
- 🟡/🔴 → STOP. Mensaje: "⚠️ Contexto en [🟡/🔴] ([X]%). Recomiendo abrir un chat nuevo. ¿Continúo aquí?"

---

## 0.2 Mode Detection

// turbo

```bash
[ -f "./docs/planning/15_DESIGN.md" ] && echo "📄 15_DESIGN.md ya existe" || echo "✨ Generando nuevo documento"
```

**Si el documento existe, mostrar:**

```markdown
| #   | Opción        | Acción                                |
| --- | ------------- | ------------------------------------- |
| 1   | **regenerar** | Regenerar documento completo          |
| 2   | **validar**   | Solo ejecutar validación multi-agente |
| 3   | **cancelar**  | Abortar                               |
```

**Si usuario elige 2 (validar):**

- Cargar y ejecutar SOLO la fase de validación del workflow
- Saltar generación, ir directo a CHECKPOINT 3

---

_Phase 0 Complete → Continuar a Phase 1 (Context Loading)_
