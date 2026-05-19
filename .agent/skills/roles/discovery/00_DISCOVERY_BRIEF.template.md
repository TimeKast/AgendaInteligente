# Discovery Brief — {{PROJECT_NAME}}

**Fecha:** {{DATE}}
**Versión:** 1.0
**Estado:** Completo | Parcial
**Stakeholder:** {{STAKEHOLDER}}
**Discovery Mode:** D0 | D1 | D2

---

## 📦 Source Package

> Documentos utilizados como input para este Discovery Brief.
> Los docs fuente pueden consultarse en fases downstream (/docs, /design, /backlog).

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

---

## §2 Usuarios y Roles

### 2.1 Tipos de Usuario

| Rol | Descripción | Cantidad | Frecuencia | Device | Nivel Técnico |
| --- | ----------- | -------- | ---------- | ------ | ------------- |
|     |             |          |            |        |               |

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
|         |             |         | 🔴 Core / 🟡 Importante / 🟢 Nice-to-have |

### 3.2 User Stories Prioritarias

1. Como **[ROL]**, quiero **[ACCIÓN]**, para **[BENEFICIO]**.
2. ...

### 3.3 Features Excluidas (Post-MVP)

-
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

> ⚠️ **Los siguientes son ejemplos comunes, NO defaults.** El agente NO debe asumir estos servicios
> a menos que el source package los mencione. Evitar stack gravity.

| Categoría | Ejemplos comunes             | Propósito      |
| --------- | ---------------------------- | -------------- |
| Email     | Resend, SendGrid, SES        | Notificaciones |
| Pagos     | Stripe, MercadoPago, Conekta | Suscripciones  |
| Storage   | Vercel Blob, S3, Cloudinary  | Uploads        |
| Analytics | PostHog, Mixpanel, GA4       | Métricas       |

---

## §6 Reglas de Negocio

### 6.1 Invariantes Críticas (NUNCA/SIEMPRE)

| ID     | Regla                                             |
| ------ | ------------------------------------------------- |
| BR-001 | [Entidad] NUNCA puede [acción] cuando [condición] |
| BR-002 | [Acción] SIEMPRE debe [requisito]                 |

### 6.2 Cálculos y Fórmulas

-

### 6.3 Estados y Transiciones

```
DRAFT ──(publish)──▶ ACTIVE ──(complete)──▶ DONE
```

### 6.4 Validaciones de Negocio

-

### 6.5 Triggers y Automatizaciones

- Cuando [evento] → [acción]

---

## §7 UI/UX

### 7.1 Plataformas

- [ ] Web responsive
- [ ] PWA (instalable)
- [ ] iOS nativo
- [ ] Android nativo

### 7.2 Pantallas Principales

| #   | Pantalla | Acceso (Roles) | Entidades que muestra | Criticidad                                |
| --- | -------- | -------------- | --------------------- | ----------------------------------------- |
|     |          |                |                       | 🔴 Core / 🟡 Importante / 🟢 Nice-to-have |

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

### 8.1 Organización

- [ ] **A) Infra Separada** — Cliente paga directamente
- [ ] **B) Infra Centralizada** — TimeKast absorbe costos

**Justificación:**

### 8.2 Hosting y DB

- **Hosting:** Vercel
- **Database:** Neon Postgres
- **Dominio:** \_\_\_

### 8.3 Jobs Programados

| Job | Frecuencia | Propósito | Si falla |
| --- | ---------- | --------- | -------- |
|     |            |           |          |

### 8.4 Timeline

- **Deadline:**
- **Prioridad si hay que sacrificar:** Features / Calidad / Performance

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

> Postura visual inicial para informar la fase de design.
> Esto NO es la especificación de diseño — es un punto de partida.

### 11.1 Postura Visual

- **Premium Level:** Budget / Standard / Premium / Luxury
- **Visual Energy:** Calm / Balanced / Dynamic / Intense
- **Brand Maturity:** Startup / Growing / Established

### 11.2 Referencias Visuales

| App/Site | Qué me gusta | Qué NO me gusta |
| -------- | ------------ | --------------- |
|          |              |                 |

### 11.3 Constraints de Marca

- **Colores prohibidos:**
- **Elementos obligatorios:**
- **Brand guidelines existentes:** Sí / No

### 11.4 Mood/Tono Visual

- **Keywords:** [ej: clean, modern, professional, playful, bold]
- **Evitar:** [ej: generic, cluttered, corporate-boring]

---

## Scope Boundaries

### Incluye (MVP)

-
-

### Excluye (Post-MVP)

-
-

### Resolved During Discovery

> Items que no venían cerrados en el source package pero se resolvieron durante esta sesión de discovery.

| #   | Tema | Resolución | Fuente                                      |
| --- | ---- | ---------- | ------------------------------------------- |
| RD1 |      |            | Checkpoint A / Entrevista / Usuario directo |

### Working Hypotheses

> Interpretaciones que el usuario aceptó provisionalmente. Requieren validación downstream.

| #   | Tema | Hipótesis | Validar en                   |
| --- | ---- | --------- | ---------------------------- |
| WH1 |      |           | /docs / /design / /implement |

### Assumptions

> Si faltó info explícita, documentar asunciones aquí con categorización.

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

## 📊 Drift Report

> Items introducidos por el discovery que NO venían del input original.

| #   | Item | Categoría                                 | Sección | Acción          |
| --- | ---- | ----------------------------------------- | ------- | --------------- |
|     |      | Harmless / Helpful / Risky / Unauthorized | §X      | OK / Fix / Flag |

---

## Reconciliation Checklist

> 🔴 **APÉNDICE MECÁNICO** — Cross-check de toda la prosa §1-§11.
> La prosa es la fuente de verdad. Este checklist es el índice verificable.

### Entidades Registradas

> CADA entidad mencionada en la prosa del Brief.

| #   | Entidad | §4.1 | §3.1 Feature | §7.2 Pantalla | §6 Reglas |
| --- | ------- | ---- | ------------ | ------------- | --------- |
|     |         |      |              |               |           |

### Pantallas Registradas

> CADA pantalla mencionada en la prosa del Brief.

| #   | Pantalla | §7.2 | Entidades | Roles que acceden |
| --- | -------- | ---- | --------- | ----------------- |
|     |          |      |           |                   |

### Features → Entidades → Pantallas (Cross-Map)

> Cross-reference de CADA feature con sus entidades, pantallas y reglas.

| Feature §3 | Entidades §4 | Pantallas §7 | Reglas §6 |
| ---------- | ------------ | ------------ | --------- |
|            |              |              |           |

---

## Próximos Pasos

1. [ ] Resolver Open Questions críticas
2. [ ] `/proposal` — Generar propuesta al cliente
3. [ ] `/docs` — Generar documentación técnica
4. [ ] `/design` — Crear artefactos de diseño

---

_Generado por TimeKast Factory — Discovery Expert v3_
