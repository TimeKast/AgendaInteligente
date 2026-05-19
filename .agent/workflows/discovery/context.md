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

**Verificar si hay Brief:**

// turbo

```bash
ls docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null && echo "✅ Brief existe" || echo "❌ No hay Brief"
```

**Si NO existe → Saltar a Phase 1**

**Si SÍ existe → Mostrar opciones:**

| #   | Modo            | Descripción                 |
| --- | --------------- | --------------------------- |
| 1   | **profundizar** | Mejorar el brief actual     |
| 2   | **revisar**     | Ver brief sin modificar     |
| 3   | **nuevo**       | Descartar y empezar de cero |

🛑 **STOP — Esperar selección del usuario.**

**Regla:** Si el usuario entrega un paquete documental sustancial, usar **D1** por defecto.

---

## 0.3 Document Versioning (D2 only)

> Solo si modo = D2 (profundizar) y Brief existe.

// turbo

```bash
cat ./.agent/workflows/_shared/doc-versioning.md
```

**Aplicar a:** `docs/planning/00_DISCOVERY_BRIEF.md`

---

_Phase 0 Complete → Continuar a Phase 1 (Context Loading)_
