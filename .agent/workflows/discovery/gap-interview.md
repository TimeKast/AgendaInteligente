# Phase 3: Gap Interview

> **Propósito:** Evaluar cobertura y preguntar solo gaps reales — preservar source-of-truth.

---

## A. Coverage Model

La cobertura ya no se mide solo por secciones. Hay **6 dimensiones:**

```markdown
## Discovery Coverage

| Dimensión                   | Estado   | Notas                          |
| --------------------------- | -------- | ------------------------------ |
| Source classification       | ✅/🟡/🔴 | Docs clasificados y procesados |
| Firm decisions frozen       | ✅/🟡/🔴 | Freeze Map completo            |
| Contradictions mapped       | ✅/🟡/🔴 | Conflictos identificados       |
| Critical gaps identified    | ✅/🟡/🔴 | Huecos priorizados             |
| Structural section coverage | ✅/🟡/🔴 | §1-§11                         |
| Drift control               | ✅/🟡/🔴 | Sin cambios no autorizados     |
```

### Coverage estructural por sección

```markdown
| #   | Sección                | Estado      | Confidence                | Notas |
| --- | ---------------------- | ----------- | ------------------------- | ----- |
| §1  | Idea General           | ✅/🟡/🔴/⚪ | Confirmed/Partial/Missing |       |
| §2  | Usuarios y Roles       | ✅/🟡/🔴/⚪ |                           |       |
| §3  | Funcionalidades Core   | ✅/🟡/🔴/⚪ |                           |       |
| §4  | Modelo de Datos        | ✅/🟡/🔴/⚪ |                           |       |
| §5  | Integraciones          | ✅/🟡/🔴/⚪ |                           |       |
| §6  | Reglas de Negocio      | ✅/🟡/🔴/⚪ |                           |       |
| §7  | UI/UX                  | ✅/🟡/🔴/⚪ |                           |       |
| §8  | Infraestructura        | ✅/🟡/🔴/⚪ |                           |       |
| §9  | Branding               | ✅/🟡/🔴/⚪ |                           |       |
| §10 | Mobile/PWA             | ✅/🟡/🔴/⚪ |                           |       |
| §11 | Visual Direction Seeds | ✅/🟡/🔴/⚪ |                           |       |
```

| Estado | Significado                         |
| ------ | ----------------------------------- |
| ✅     | Suficiente y estable                |
| 🟡     | Parcial, requiere aclaración        |
| 🔴     | Faltante o inconsistente            |
| ⚪     | No aplica / diferido explícitamente |

---

## B. Gap Interview Rules

> Solo preguntar si hay alguna de estas condiciones:

1. Falta una decisión crítica
2. Hay contradicción entre fuentes
3. Algo tiene alto costo de reversión
4. El scope/timeline no puede evaluarse sin ese dato

### Límite de preguntas

| Situación                                 | Regla                             |
| ----------------------------------------- | --------------------------------- |
| D1 con source rico                        | min = max(3, 🟡 + contradictions) |
| Ambigüedad alta                           | 3-5 preguntas                     |
| Microaclaraciones cerradas del mismo tema | hasta 5                           |
| D0 (desde cero)                           | 2-3 por ronda, iterativo          |

> 🔴 **"0 preguntas" NUNCA es válido para D1.** Ver §B.2 para mínimos obligatorios.

### Pre-check obligatorio (ANTES de cada pregunta)

El agente **DEBE** verificar internamente:

- ¿Esto ya está resuelto en la fuente principal?
- ¿Esto es realmente necesario para el brief?
- ¿Estoy preguntando por **hueco real** o por **ritual de plantilla**?

### Para D0 (desde cero)

```markdown
"Vamos a entender tu proyecto.
Empecemos por lo más importante: ¿qué problema resuelve tu app y para quién?"
```

### Para D1 (con docs)

```markdown
"He procesado [N] documentos y tengo [X] decisiones firmes y [Y] gaps.
Voy a preguntarte solo por lo que no está claro. Aquí van las preguntas:"
```

---

## B.2 Minimum Coverage Questions (D1 Mode)

> 🔴 **Even with a rich source package, a D1 gap interview MUST cover:**

1. **For EACH 🟡 section** in the Coverage Map → ask at least 1 targeted question
2. **For EACH contradiction** (C01, C02...) → ask the user to resolve explicitly
3. **For EACH high-cost-of-reversión decision** → confirm with the user ("The source says X. Is this correct?")

### Minimum question formula

```
min_questions = max(3, count_of_🟡_sections + count_of_contradictions)
```

> The purpose is NOT to fill time — it's to force re-reading specific source sections
> and confirming critical specs with the user. This creates the enrichment loop that
> produces better Resolved items and catches edge cases.
>
> ⚠️ A rich source package does NOT mean 0 questions. It means BETTER questions.

### Question types for D1

| Type                         | When                                      | Format                                                  |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| **Confirmation**             | High-cost decision in source              | "Source says [X]. Is this correct for this build?"      |
| **Contradiction resolution** | Two sources disagree                      | "Doc A says [X], Doc B says [Y]. Which applies?"        |
| **Gap fill**                 | 🟡 section missing detail                 | "Section [N] lacks [specific detail]. Can you clarify?" |
| **Edge case**                | Complex feature with implicit assumptions | "What happens when [edge case scenario]?"               |
| **Enrichment**               | Core feature lacks depth or spec          | "How exactly does [X] work? What makes it special?"     |

> 🔴 **Enrichment questions are NOT optional filler.**
> They explore depth of core features: premium capabilities, UX differentiators,
> algorithm specifics, configuration options. Run 1 asked about Superhost differences,
> autopick algorithms, and pick structure — these surfaced 5+ additional features.
> Aim for at least 2 enrichment questions per gap interview.

---

## C. Freeze Map Consolidation (Post-Interview)

> 🔴 **OBLIGATORIO al terminar la entrevista — para TODOS los modos.**
> Esto estandariza el flujo: desde Phase 4, SIEMPRE hay un Freeze Map completo.

### D0: Construir Freeze Map desde la entrevista

Si el modo es D0 (sin documentos), la entrevista ES el discovery principal.
Al terminarla, formalizar TODO lo capturado en formato Freeze Map:

1. Tomar todas las respuestas del usuario
2. Clasificar cada pieza como: Firma / Abierta / Recomendación / Excluida
3. Generar la tabla estándar del Freeze Map (misma estructura que §2.2)
4. Persistir como `.discovery-wip/freeze-map.md`

> En D0, el Freeze Map se construye DESPUÉS de la entrevista, no antes.
> Esto es la diferencia con D1/D2 donde el Freeze Map existe antes de la entrevista.

### D1/D2: Re-guardar Freeze Map con resoluciones

Si el modo es D1 o D2, el Freeze Map ya existe de Phase 2.
La entrevista puede haber resuelto OQs o cerrado decisiones abiertas.

1. Tomar resoluciones de la entrevista
2. Reclasificar items del Freeze Map (O→F si se cerró, etc.)
3. Re-guardar el archivo `.discovery-wip/freeze-map.md` actualizado

### Persistir (TODOS los modos)

// turbo

```bash
mkdir -p docs/planning/.discovery-wip
```

El agente DEBE guardar/actualizar: `docs/planning/.discovery-wip/freeze-map.md`

---

_Phase 3 Complete → Continuar a Phase 4 (Feature Deep-Dive)_
