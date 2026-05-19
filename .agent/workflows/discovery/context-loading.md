# Phase 1: Context Loading

> **Propósito:** Cargar contexto del kit, clasificar documentos fuente, y preparar para extracción.
> **Se ejecuta SIEMPRE.**

---

## 1.1 Loading Profile by Mode

> 🎯 **Cargar solo lo necesario según el modo detectado.**

| Mode                | Cargar                                               | NO cargar                                |
| ------------------- | ---------------------------------------------------- | ---------------------------------------- |
| **D0 light**        | rules, SKILL, agent, project-config                  | features, explorer, code-archaeologist   |
| **D1 standard**     | rules, SKILL, agent, project-config, features        | code-archaeologist (solo si hay v1 real) |
| **D1 legacy-heavy** | todo + explorer + code-archaeologist                 | —                                        |
| **D2 brief-audit**  | rules, SKILL, agent, brief existente, source package | explorer, code-archaeologist             |

## 1.2 Kit Context Loading

// turbo

```bash
cat ./.agent/rules/DOR_DOD.md 2>/dev/null || echo "No DOR_DOD rules"
```

// turbo

```bash
cat ./.agent/skills/roles/discovery/SKILL.md
```

// turbo

```bash
cat ./docs/planning/project-config.md 2>/dev/null || echo "No project-config.md"
```

// turbo

```bash
ls -la ./docs/planning/ 2>/dev/null || echo "No planning docs yet"
```

---

## 1.3 Agent Loading

// turbo

```bash
cat ./.agent/agents/discovery-expert.md
```

---

## 1.4 Reference Loading (D1/D2 only)

> Cargar features existentes del boilerplate para contexto.
> **Saltar en D0 light** a menos que haya señal clara de proyecto sobre boilerplate existente.

// turbo

```bash
cat ./docs/reference/features.md 2>/dev/null || echo "No features.md"
```

// turbo

```bash
# Si hay código existente, cargar agentes de exploración
ls ./src 2>/dev/null && cat ./.agent/agents/explorer-agent.md || echo "No src/ directory"
```

// turbo

```bash
ls ./src 2>/dev/null && cat ./.agent/agents/code-archaeologist.md || echo "No code-archaeologist needed"
```

---

## 1.5 Source Classification

> 🔴 **MANDATORY para D1/D2.** Clasificar TODOS los docs proporcionados.

**El agente DEBE generar esta tabla para CADA documento recibido:**

```markdown
## 📦 Source Package

| #   | Documento | Clasificación                                   | Decisiones Clave | Procesado |
| --- | --------- | ----------------------------------------------- | ---------------- | --------- |
| 1   | [nombre]  | SoT / Reference / Legacy / Attachment / Context | [resumen]        | ✅/❌     |
```

### Clasificaciones

| Clasificación             | Significado                                   | Tratamiento                                 |
| ------------------------- | --------------------------------------------- | ------------------------------------------- |
| **Source of Truth (SoT)** | Doc principal, decisiones finales             | Extraer y congelar decisiones               |
| **Reference**             | Doc de soporte, no sobreescribe SoT           | Extraer insights, defer a SoT en conflictos |
| **Legacy**                | Versión anterior/codebase                     | Extraer lecciones y anti-patrones           |
| **Attachment**            | Screenshots, excels, reportes, procedimientos | Procesar TODOS — no saltar contenido        |
| **Context**               | Info de fondo, conocimiento de industria      | Enriquecer, no usar como decisiones         |

> 🔴 **REGLA DE BULK ATTACHMENTS:**
> Procesar TODO el material cuando sea input relevante para discovery.
> Si el volumen es extremo, se permite:
>
> - Particionado explícito ("procesando lote 1/3")
> - Loteo por prioridad declarada
> - Procesamiento por relevancia justificada
>
> Pero **NUNCA hacer sampling silencioso**.
> Si se omite material, se declara qué se omitió y por qué.

---

## 1.6 SK Usage Detection

> Determina si el proyecto se construye sobre el Starter Kit.
> Esto activa/desactiva Phase 5 (SK Leverage).

**Detección automática:**

// turbo

```bash
ls ./src/components/ui/data-table.tsx 2>/dev/null && echo "SK_DETECTED=true" || echo "SK_DETECTED=false"
```

**Si SK no detectado → preguntar:**

"¿Este proyecto se construye sobre el Starter Kit de TimeKast? (sí/no)"

**Flag para downstream:**

- `SK_ACTIVE = true` → Phase 5 se ejecuta
- `SK_ACTIVE = false` → Phase 5 se salta

> ⚠️ No depender de project-config.md (se crea durante discovery, no antes).

---

_Phase 1 Complete → Continuar a Phase 2 (Freeze Map)_
