# Discovery Brief — {{PROJECT_NAME}}

**Fecha:** {{DATE}}
**Versión:** 1.0
**Estado:** Completo | Parcial
**Stakeholder principal:** {{STAKEHOLDER}}
**Discovery Mode:** D0 | D1 | D2

> ⭐ **Durable constraint del proyecto:** Quality >> Deadline (`BR-PROJECT-001`). Si hay trade-off entre calidad y fecha, calidad manda. Ship tarde con calidad, nunca a tiempo con deuda técnica.

---

## 📦 Source Package

> Documentos utilizados como input para este Discovery Brief. Los docs fuente pueden consultarse en fases downstream (`/proposal`, `/docs`, `/design`, `/backlog`).

| #   | Documento | Clasificación                                   | Decisiones Clave | Ubicación |
| --- | --------- | ----------------------------------------------- | ---------------- | --------- |
| 1   |           | SoT / Reference / Legacy / Attachment / Context |                  |           |

---

## 📊 Coverage Map

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

**Coverage Total:** X/11 completas
**Deadline:** {{DEADLINE}}

---

## 📋 Decision Registry

> Decisiones extraídas del Source Package. Cada decisión tiene tipo y reversibilidad.

| #   | Decisión | Tipo                      | Fuente | Reversibilidad   | Sección |
| --- | -------- | ------------------------- | ------ | ---------------- | ------- |
| D1  |          | Firm / Open / Recommended |        | Low / Med / High | §X      |

---

## §1 Idea General

### 1.1 Pitch de Elevador

> En 2-3 oraciones: qué hace, para quién, por qué.

### 1.2 Problema que Resuelve

- **Dolor principal:**
- **Cómo lo resuelven hoy:**
- **Por qué no funciona:**

### 1.3 Solución Propuesta

- **Ventaja competitiva:**

### 1.4 North Star (Métrica de Éxito)

- **Métrica:**
- **Target:**

### 1.5 Alcance MVP vs Futuro

| MVP | Fase 2 | Futuro |
| --- | ------ | ------ |
|     |        |        |

### 1.6 Durable constraints

- ⭐ **Quality >> Deadline** (`BR-PROJECT-001`) — heredado dogma TimeKast.
- {{otros constraints explícitos del stakeholder}}

---

## §2 Usuarios y Roles

> **Nota arquitectónica:** stakeholders + team members viven en `project-config.md §8` (always-on @import en CLAUDE.md). NO duplicar aquí. Esta sección cubre solo personas/JTBD + RBAC + onboarding + auth — info feature-level que `/implement` necesita pero no está en project-config.

### 2.1 Personas principales (JTBD-based)

> Absorbe 03_PERSONAS.md. Para ≤5 personas inline. Si 6+ con JTBDs complejos → mantener resumen aquí + mover detalle a Appendix B del brief.

| Rol | JTBD (qué intenta lograr) | Device principal         | Frecuencia de uso             | Nivel técnico                  |
| --- | ------------------------- | ------------------------ | ----------------------------- | ------------------------------ |
|     |                           | Mobile / Desktop / Ambos | Diario / Semanal / Esporádico | Básico / Intermedio / Avanzado |

### 2.2 Matriz de Permisos

| Acción   | Rol 1 | Rol 2 | Admin |
| -------- | ----- | ----- | ----- |
| Ver      |       |       |       |
| Crear    |       |       |       |
| Editar   |       |       |       |
| Eliminar |       |       |       |

### 2.3 Flujo de Onboarding

- **Registro:** Auto / Invitación
- **Aprobación:** Sí / No
- **Verificación email:** Sí / No

### 2.4 Autenticación

- [ ] Email + Password
- [ ] Magic Link
- [ ] Google OAuth
- [ ] Apple OAuth
- [ ] Otro: \_\_\_

---

## §3 Funcionalidades Core (MVP)

### 3.1 Features MVP

| Feature | Descripción | Usuario | Criticidad                                |
| ------- | ----------- | ------- | ----------------------------------------- |
| FT-001  |             |         | 🔴 Core / 🟡 Importante / 🟢 Nice-to-have |

### 3.2 SK Leverage Summary

> Solo si SK_ACTIVE=true. Ver `discovery-artifacts/sk-leverage.md` durante discovery.

- **Total features:** N
- **Configure (S):** X% / **Extend (M):** Y% / **Build (L/XL):** Z%
- **Overall SK Coverage:** {{percent}}%

### 3.3 User Stories Prioritarias

1. Como **[ROL]**, quiero **[ACCIÓN]**, para **[BENEFICIO]**.
2. ...

### 3.4 Features Excluidas (Post-MVP)

- ***

## §4 Modelo de Datos

### 4.1 Entidades Principales

| #   | Entidad | Descripción | Campos Clave | Estados | CRUD Admin | CRUD User |
| --- | ------- | ----------- | ------------ | ------- | ---------- | --------- |
|     |         |             |              |         | ✅/❌      | ✅/❌     |

### 4.2 Relaciones

```
[Entidad A] ──1:N──▶ [Entidad B]
[Entidad B] ──N:M──▶ [Entidad C]
```

### 4.3 Datos Sensibles

- [ ] PII (nombre, email, teléfono)
- [ ] Financieros
- [ ] Salud
- [ ] Compliance requerido: \_\_\_

---

## §5 Integraciones

### 5.1 APIs Externas

| Proveedor | Propósito | Frecuencia | Costo Est. |
| --------- | --------- | ---------- | ---------- |
|           |           |            |            |

### 5.2 Servicios Terceros

> ⚠️ **Los siguientes son ejemplos comunes, NO defaults.** El agente NO asume estos servicios a menos que el source package los mencione. Evitar stack gravity.

| Categoría | Ejemplos comunes             | Propósito      |
| --------- | ---------------------------- | -------------- |
| Email     | Resend, SendGrid, SES        | Notificaciones |
| Pagos     | Stripe, MercadoPago, Conekta | Suscripciones  |
| Storage   | Vercel Blob, S3, Cloudinary  | Uploads        |
| Analytics | PostHog, Mixpanel, GA4       | Métricas       |

---

## §6 Reglas de Negocio

> **Architectural note:** las definiciones canónicas de cada BR viven en `freeze-map.md` (F-codes Firm decisions con reversibilidad + source citation) y en `deep-dive.md §FT-X §Rules` (per-feature scope). Esta sección NO duplica esas definiciones — solo:
>
> 1. **§6.1 Invariantes críticas cross-cutting** narrative (NUNCA/SIEMPRE) — `/implement` carga brief al inicio de sesión y necesita estas presentes
> 2. **§6.2 BR Index compact** — tabla `BR-{DOMAIN}-{NN} | 1-line summary | → freeze-map F{N} / deep-dive FT-X` para que `/implement` vea el listado consolidado sin hops para casos genéricos
>
> Definiciones full → `discovery-artifacts/freeze-map.md` (canónico) + `discovery-artifacts/deep-dive.md` (per-feature).

### 6.1 Invariantes críticas (NUNCA/SIEMPRE) — cross-cutting

> Solo invariantes que aplican global / cross-cutting (fairness, security, privacy). NO BRs feature-specific (esos van en deep-dive §Rules).

| ID     | Regla                                             |
| ------ | ------------------------------------------------- |
| BR-001 | [Entidad] NUNCA puede [acción] cuando [condición] |
| BR-002 | [Acción] SIEMPRE debe [requisito]                 |

### 6.2 BR Index (compact — definiciones full en freeze-map / deep-dive)

| BR ID            | Summary 1-line                | Canonical                          |
| ---------------- | ----------------------------- | ---------------------------------- |
| BR-{DOMAIN}-{NN} | {1-line — qué locks la regla} | → freeze-map F{N} · deep-dive FT-X |

---

## §7 UI/UX

### 7.1 Plataformas

- [ ] Web responsive
- [ ] PWA (instalable)
- [ ] iOS nativo
- [ ] Android nativo

> Si SK_ACTIVE=true, PWA es default (heredado de `sk-pwa`).

### 7.2 Pantallas Principales

| #   | Pantalla | Acceso (Roles) | Entidades que muestra | Criticidad                                |
| --- | -------- | -------------- | --------------------- | ----------------------------------------- |
| P1  |          |                |                       | 🔴 Core / 🟡 Importante / 🟢 Nice-to-have |

### 7.3 Flujos Críticos

| #   | Flujo | Pantallas involucradas | Trigger → Resultado |
| --- | ----- | ---------------------- | ------------------- |
|     |       |                        |                     |

### 7.4 Preferencias de Diseño

- **Estilo:** Minimalista / Colorido / Corporativo / Playful
- **Dark mode:** Sí / No / Ambos
- **Referencias:** [apps que gustan]

---

## §8 Infraestructura

### 8.1 Organización del hosting

- [ ] **A) Infra Separada** — Cliente paga directamente
- [ ] **B) Infra Centralizada** — TimeKast absorbe costos

**Justificación:**

### 8.2 Hosting y DB

- **Hosting:** {{Vercel}}
- **Database:** {{Neon Postgres}}
- **Dominio:** \_\_\_

### 8.3 Architecture topology

> **Condicional:** solo poblar si §8.4 ≠ "Sí stack completo del kit". Si es SK default, dejar vacío con nota "ver topology del kit en sk-features-index".

**Componentes principales:**

- [Componente]: [responsabilidad]

**Flujo de datos:** [2-3 líneas describiendo cómo fluye data entre componentes]

### 8.4 Kit divergence flag

**¿Este proyecto usa el stack estándar del Starter Kit?**

- [ ] **Sí — stack completo del kit.** §8.3 vacío. No se genera 07_ARCHITECTURE.md.
- [ ] **Parcial — usa kit + additions.** Listar additions con razón. §8.3 describe additions.
- [ ] **No — stack custom.** §8.3 topology completo. ADRs se generan en `/audit architecture`.

### 8.5 Jobs Programados

| Job | Frecuencia | Propósito | Si falla |
| --- | ---------- | --------- | -------- |
|     |            |           |          |

### 8.6 Timeline

- **Deadline objetivo:** {{DEADLINE}}
- **Trade-off resuelto por dogma:** Calidad >> Fecha (`BR-PROJECT-001`). Esta fila NO se negocia a nivel discovery.
- **Términos comerciales y ownership de infra:** ver `project-config.md §13 Delivery Model`.

### §8.7 Descope Plan (conditional — obligatorio si `project-planner` veredicto = 🔴)

> Tabla aterrizada de features descopeadas pre-emptive + effort salvado + condicional trigger. Requerida por el gate Phase 7 de tk-discovery cuando planner devuelve 🔴.

**Pre-emptive descope (day 0 — negociado con stakeholder):**

| #   | Feature / ajuste | Points salvados | Justificación |
| --- | ---------------- | :-------------: | ------------- |
| 1   |                  |                 |               |

**Condicional descope (trigger: velocity < X pts/dev/sem al fin de sem N):**

| #   | Feature | Points | Riesgo de cortar |
| --- | ------- | :----: | ---------------- |
| 1   |         |        |                  |

### §8.8 Post-MVP critical milestones (conditional — si planner identificó entregables post-deadline con fecha propia)

| Entregable | Fecha          | Notas |
| ---------- | -------------- | ----- |
|            | {{YYYY-MM-DD}} |       |

---

## §9 Branding

### 9.1 Nombre y Logo

| Elemento | Estado                                      |
| -------- | ------------------------------------------- |
| Nombre   | ✅ Definido / 🟡 Tentativo / 🔴 Por definir |
| Logo     | ✅ Disponible / 🔴 Por crear                |
| Favicon  | ✅ Disponible / 🔴 Por crear                |

### 9.2 Paleta de Colores

| Tipo      | Hex     | Uso                   |
| --------- | ------- | --------------------- |
| Primary   | #\_\_\_ | CTA buttons           |
| Secondary | #\_\_\_ | Elementos secundarios |
| Accent    | #\_\_\_ | Highlights            |

### 9.3 Tipografía

- **Headings:** [font] o "default"
- **Body:** [font] o "default"

### 9.4 Tono de Comunicación

- **Formalidad:** Formal / Neutral / Casual
- **Tratamiento:** Tú / Usted
- **Idioma:** Español / Inglés / Ambos

### 9.5 Assets Existentes

- [ ] Logo SVG
- [ ] Logo PNG transparente
- [ ] Brand guidelines
- [ ] OG image (1200x630)

**Link a assets:**

---

## §10 Mobile/PWA

### 10.1 Device Principal

| Device  | Prioridad |
| ------- | --------- |
| Mobile  | 🥇/🥈/❌  |
| Tablet  | 🥇/🥈/❌  |
| Desktop | 🥇/🥈/❌  |

> Mobile-first 375px es default del kit (heredado de `SK.md §3.2`). Opt-out solo con justificación explícita.

### 10.2 Funcionalidad Offline

- [ ] Ninguno (siempre online)
- [ ] Básico (datos cacheados)
- [ ] Parcial (crear/editar offline, sync después)
- [ ] Completo

### 10.3 Capacidades Nativas

| Capacidad          | ¿Necesario? | Caso de uso |
| ------------------ | ----------- | ----------- |
| Cámara             | Sí/No       |             |
| GPS                | Sí/No       |             |
| Push Notifications | Sí/No       |             |
| Biometría          | Sí/No       |             |

### 10.4 Instalabilidad

- [ ] PWA Instalable
- [ ] Solo Web
- [ ] App Store

**Nombre corto PWA:** \_\_\_ (máx 12 chars)

### 10.5 Performance Targets

- **TTI:** < 3s 4G
- **Lighthouse:** ≥ 80

---

## §11 Visual Direction Seeds

> Postura visual inicial para informar `/design`. NO es la especificación de diseño — es punto de partida.

### 11.1 Postura Visual

- **Premium Level:** Budget / Standard / Premium / Luxury
- **Visual Energy:** Calm / Balanced / Dynamic / Intense
- **Brand Maturity:** Startup / Growing / Established

### 11.2 Design System Strategy

**¿Cómo se diseñará este proyecto visualmente?** (elegir una)

- [ ] **Use SK default** (Neumorphism) ← DEFAULT 90% de casos
      Design exploratorio genera tokens extendidos sobre SK.
      NO se genera 15_SK_MIGRATION.md.

- [ ] **Custom via Claude Design** (fork posterior)
      Design exploratorio genera estructura + placeholders.
      Fork Claude Design genera DS custom + mockups high-fi (fase futura, ver master plan §7).
      Se genera 15_SK_MIGRATION.md con diff vs SK.
      Llenar §11.3 abajo.

- [ ] **Client's existing DS** (si cliente tiene DS propio)
      Design exploratorio adapta estructura al DS del cliente.
      Se genera 15_SK_MIGRATION.md con adaptación.
      Cliente provee: [link a Figma / Storybook / docs]

### 11.3 Claude Design Fork (solo si §11.2 = "Custom via Claude Design")

> **Framing:** si §11.2 ≠ "Custom via Claude Design", dejar esta sección con nota **"N/A — ver §11.2"**. No inventar valores.

- **Scope del fork:**
  - [ ] Solo tokens (colors, typography, spacing)
  - [ ] Tokens + mockups de pantallas P0
  - [ ] Tokens + mockups de todas las pantallas
  - [ ] DS completo (tokens + components + mockups + guidelines)

- **Branding input para Claude Design:**
  - Mood: [Premium / Playful / Professional / Editorial / etc.]
  - Inspiración visual: [links a referencias]
  - Restricciones del cliente: [colores obligatorios, typography brand]
  - Output format: [Figma / PNG mockups / Both]

- **Cuándo ejecutar el fork:**
  - [ ] Después de /design exploratorio, antes de /backlog
  - [ ] En paralelo con /implement
  - [ ] Post-MVP (commercial polish phase)

> Esta sección se llena durante discovery pero el fork NO se ejecuta hasta que el pipeline principal esté estable y el proyecto lo requiera.

### 11.4 Referencias Visuales

| App/Site | Qué me gusta | Qué NO me gusta |
| -------- | ------------ | --------------- |
|          |              |                 |

### 11.5 Constraints de Marca

- **Colores prohibidos:**
- **Elementos obligatorios:**
- **Brand guidelines existentes:** Sí / No

### 11.6 Mood/Tono Visual

- **Keywords:** [ej: clean, modern, professional, playful, bold]
- **Evitar:** [ej: generic, cluttered, corporate-boring]

---

## Scope Boundaries

### Incluye (MVP)

-

### Excluye (Post-MVP)

-

### Working Hypotheses

> Interpretaciones que el stakeholder aceptó provisionalmente. Requieren validación downstream.

| #   | Tema | Hipótesis | Validar en                   |
| --- | ---- | --------- | ---------------------------- |
| WH1 |      |           | /docs / /design / /implement |

### Assumptions

> Si faltó info explícita, documentar asunciones aquí con categorización.
>
> **Nota de redacción (obligatoria):** cada assumption de esta tabla debe aparecer con prefijo `[ASSUMPTION]` **inline** en la prosa de la sección referenciada. Aplica igual para `[INFERRED]` (tabla Drift Report §Inferred) y `[OQ]` (tabla Open Questions). Ver [methodology.md §4](../methodology.md). Sin tagging inline → brief pierde scan-readability + drift audit falla.

| #   | Assumption | Categoría                    | Impacto si incorrecta | Sección |
| --- | ---------- | ---------------------------- | --------------------- | ------- |
| A1  |            | Harmless / Risky / High-Risk |                       | §X      |

---

## Open Questions

| #   | Pregunta | Impacto       | Owner            | Estado |
| --- | -------- | ------------- | ---------------- | ------ |
| Q1  |          | Alto/Med/Bajo | Cliente/TimeKast | ⬜/✅  |

---

## Riesgos

| Risk | Severidad    | Impacto | Mitigación |
| ---- | ------------ | ------- | ---------- |
|      | High/Med/Low |         |            |

---

## 🛡️ Challenge Pass Report

> Slim summary post-Phase-7 + Gap Round 2. Detail full vive en `discovery-artifacts/challenge-pass.md` (per-finding mitigation options + {{stakeholder override rationale}} + per-ADR scope) y `discovery-artifacts/freeze-map.md §Phase 7 GR2 Resolutions` (firm decisions canónicas). `/implement` no carga el detail; `/docs` sí cuando drafts ADRs.

### Verdicts (post Phase 7 + GR2)

| Agent           | Verdict                            | HIGH / MED / LOW |
| --------------- | ---------------------------------- | ---------------- |
| architect       | ✅/⚠️/🔴 — {N ADRs required if 🔴} | X / Y / Z        |
| product-owner   | ✅/⚠️/🔴 — {1-line summary}        | X / Y / Z        |
| project-planner | ✅/⚠️/🔴 — {1-line summary}        | X / Y / Z        |

### Stakeholder decisions resolved (GR2)

{N/N} — see `freeze-map.md §Phase 7 Gap Round 2 Resolutions` for firm decisions.

### ADRs required pre-backlog

{N} ADRs identified — see `challenge-pass.md §1 Architect Findings` + `§5 Required ADRs` for full evaluation criteria + mitigation options.

### Gate readiness

{✅/⚠️} Scope locked · {✅/⚠️} Schema rollback ADR · {N} OQs remaining ({X} ADR-cover + {Y} defer to /docs)

---

## 📊 Drift Report

> Items introducidos por el discovery que NO venían del input original.

| #   | Item | Categoría                                 | Sección | Acción          |
| --- | ---- | ----------------------------------------- | ------- | --------------- |
|     |      | Harmless / Helpful / Risky / Unauthorized | §X      | OK / Fix / Flag |

---

## Appendix A — Reconciliation Checklist

> 🔴 **APÉNDICE MECÁNICO** — Cross-check de toda la prosa §1-§11. La prosa es fuente de verdad. Este checklist es el índice verificable.

### A.1 Entidades Registradas

> CADA entidad mencionada en la prosa del Brief.

| #   | Entidad | §4.1 | §3.1 Feature | §7.2 Pantalla | §6 Reglas |
| --- | ------- | ---- | ------------ | ------------- | --------- |
| E1  |         |      |              |               |           |

### A.2 Pantallas Registradas

> CADA pantalla mencionada en la prosa del Brief.

| #   | Pantalla | §7.2 | Entidades | Roles que acceden |
| --- | -------- | ---- | --------- | ----------------- |
| P1  |          |      |           |                   |

### A.3 Features → Entidades → Pantallas → Reglas (Cross-Map)

> Cross-reference de CADA feature con sus entidades, pantallas y reglas.

| Feature §3 | Entidades §4 | Pantallas §7 | Reglas §6 |
| ---------- | ------------ | ------------ | --------- |
| FT-001     |              |              |           |

---

## Próximos Pasos

1. [ ] Resolver Open Questions críticas
2. [ ] `/proposal` — Generar propuesta al cliente
3. [ ] `/docs` — Generar documentación técnica
4. [ ] `/design` — Crear artefactos de diseño
5. [ ] `/backlog` — Issues ejecutables

---

_TimeKast Factory — Discovery Brief_
