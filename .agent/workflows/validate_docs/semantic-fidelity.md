# Phase V2: Semantic Fidelity

> **Propósito:** Re-leer la prosa de los documentos y verificar que el CONTENIDO
> sea fiel a la fuente, no solo que los IDs existan.
>
> **Diferencia con V1:** V1 verifica que "Feature X tiene FT-XXX". V2 verifica que
> "la descripción de FT-XXX refleja exactamente lo que el cliente pidió en el Brief".
>
> **Mentalidad:** "¿Con estos documentos, otro agente podría construir la app
> EXACTAMENTE como la pidió el cliente?"

---

## 2.1 Protocolo de Re-lectura

> 🔴 **OBLIGATORIO:** El agente DEBE re-leer CADA par de documentos adyacentes
> en la cadena y responder las preguntas de fidelidad.

### Pares de documentos a comparar

| #   | Upstream (fuente)              | Downstream (derivado) | Qué comparar                              |
| --- | ------------------------------ | --------------------- | ----------------------------------------- |
| 1   | 00_DISCOVERY_BRIEF             | 01_PROPOSAL           | ¿Proposal captura la intención del Brief? |
| 2   | 00_DISCOVERY_BRIEF             | 02-14 (todos)         | ¿Docs formalizan correctamente el Brief?  |
| 3   | 00_DISCOVERY_BRIEF + 02-14     | 15_DESIGN             | ¿Design refleja lo documentado?           |
| 4   | 00_DISCOVERY_BRIEF + 15_DESIGN | Backlog issues        | ¿Issues cubren lo diseñado?               |

**Para CADA par, el agente DEBE:**

1. Leer el upstream COMPLETO
2. Leer el downstream COMPLETO
3. Responder las **7 preguntas de fidelidad** (sección 2.2)
4. Documentar hallazgos con citas textuales

---

## 2.2 Preguntas de Fidelidad (MANDATORY per pair)

> 🔴 **Responder CADA pregunta con evidencia concreta de los docs.**
> NO responder "sí" sin citar la sección o contenido relevante.

### Pregunta 1: ¿Captura la INTENCIÓN?

> ¿El doc downstream captura fielmente la INTENCIÓN del upstream, no solo los IDs?

**Buscar específicamente:**

- [ ] Objetivos de negocio del Discovery §1 reflejados en Proposal §2 y en los docs
- [ ] El "por qué" detrás de cada feature se preserva, no solo el "qué"
- [ ] Prioridades del cliente (lo que mencionó como "crítico" o "importante") reflejadas correctamente
- [ ] Contexto del dominio no perdido (términos, procesos, stakeholders)

### Pregunta 2: ¿Hay requisitos IMPLÍCITOS no formalizados?

> ¿Hay cosas mencionadas en la prosa del upstream que no se formalizaron como IDs downstream?

**Buscar específicamente:**

- [ ] Entidades mencionadas en narrativa de features pero sin E-XXX en data model
- [ ] Validaciones de negocio descritas en prosa pero sin BR-XXX
- [ ] Flujos de usuario implícitos en user stories pero sin FLW-XXX en design
- [ ] Permisos o roles mencionados pero sin implementación en auth/RBAC
- [ ] Integraciones mencionadas pero sin issue que las cubra

### Pregunta 3: ¿Hay SCOPE CREEP?

> ¿Hay cosas en el downstream que NO están en el upstream?

**Buscar específicamente:**

- [ ] Features en docs que no aparecen en Brief §3
- [ ] Entidades en data model que no corresponden a ningún feature
- [ ] Pantallas en design que no tienen user story asociada
- [ ] Issues en backlog que no mapean a ningún US/SCR/BR
- [ ] Complejidad añadida sin justificación (campos extra, flujos extra)

### Pregunta 4: ¿Se preserva la PRIORIDAD?

> ¿Algo "crítico" en el Brief es P2/P3 en el backlog? ¿Algo "nice-to-have" es P0?

**Buscar específicamente:**

- [ ] Features MVP del Brief (§3) que terminaron como P2/P3 en backlog
- [ ] Features excluidas (§3.6) que se colaron como P1 en backlog
- [ ] Riesgos high-impact de §8 que no tienen issue P0
- [ ] Orden de implementación que contradice prioridades de negocio

### Pregunta 5: ¿Es CONSTRUIBLE?

> ¿Con estos docs, otro agente sin contexto previo podría construir la app exactamente como la pidió el cliente?

**Buscar específicamente:**

- [ ] Ambigüedades: ¿Hay decisiones que quedan "a criterio del developer"?
- [ ] Gaps de implementación: ¿Falta info clave (validaciones, estados, comportamiento de error)?
- [ ] Dependencias no documentadas: ¿Hay features que dependen de algo que no tiene issue?
- [ ] Contradicciones entre docs: ¿El data model dice una cosa y la API otra?

### Pregunta 6: ¿TERMINOLOGÍA consistente?

> ¿Los mismos conceptos usan los mismos nombres en toda la cadena?

**Buscar específicamente:**

- [ ] Entidades con nombres diferentes en Brief vs docs vs design (ej. "Movimiento" vs "Transacción")
- [ ] Acciones con verbos diferentes (ej. "crear" vs "registrar" vs "agregar")
- [ ] Glosario (09_GLOSSARY) alineado con el uso real en todos los docs
- [ ] Status y estados con nombres inconsistentes

### Pregunta 7: ¿SK APROVECHADO?

> ¿Se reutilizan los features existentes del Starter Kit o se están reinventando?

**Buscar específicamente:**

- [ ] Issues que recrean funcionalidad del SK (auth, RBAC, CRUD patterns, DataTable)
- [ ] Componentes "nuevos" (CMP-XXX) que ya existen como UI primitivos
- [ ] Data model patterns que difieren del patrón del SK sin justificación
- [ ] API patterns que no siguen las convenciones del SK

### Pregunta 8: ¿SEGURIDAD y FAIRNESS documentados?

> ¿Los docs cubren protección de datos, permisos, y fairness competitiva?

**Buscar específicamente:**

- [ ] RBAC matrix existe en 07_ARCHITECTURE o 03_USER_PERSONAS — roles × recursos × permisos
- [ ] Reglas de visibilidad de datos documentadas por rol (quién ve qué, pre/post lock si aplica)
- [ ] Constraints de inmutabilidad documentados para datos financieros/competitivos (ej: líneas capturadas, scores evaluados)
- [ ] Audit trail: ¿qué acciones sensibles generan registro? (cambios de rol, modificación de datos competitivos, evaluaciones)
- [ ] Si el proyecto tiene dummy/proxy users: constraints de seguridad documentados (ej: email bloqueado, notificaciones limitadas)

---

## 2.3 Output V2

> 🔴 **CADA hallazgo DEBE tener cita textual del doc upstream y downstream.**

### Formato de hallazgo semántico:

```markdown
### 🟡 [Severidad] Título del hallazgo

**Par:** `00_DISCOVERY_BRIEF` → `06_DATA_MODEL`
**Pregunta de fidelidad:** #2 (Requisitos implícitos no formalizados)

**Upstream dice (Brief §3.1):**

> "El admin debe poder gestionar las cuentas bancarias de cada beneficiario..."

**Downstream (06_DATA_MODEL):**
No existe entidad E-XXX para "Cuenta Bancaria". Solo E-005 Beneficiario
sin campo de cuenta.

**Impacto:** Se perdería la capacidad de gestionar múltiples cuentas por beneficiario.
**Sugerencia:** Agregar E-010 CuentaBancaria con FK a E-005.
```

### Tabla resumen por par:

| Par              | P1 Intención | P2 Implícitos | P3 Creep | P4 Prioridad | P5 Construible | P6 Terminología | P7 SK | P8 Security |
| ---------------- | :----------: | :-----------: | :------: | :----------: | :------------: | :-------------: | :---: | :---------: |
| Brief → Proposal |    ✅/🔴     |     ✅/🔴     |  ✅/🔴   |    ✅/🔴     |     ✅/🔴      |      ✅/🔴      | ✅/🔴 |    ✅/🔴    |
| Brief → Docs     |    ✅/🔴     |     ✅/🔴     |  ✅/🔴   |    ✅/🔴     |     ✅/🔴      |      ✅/🔴      | ✅/🔴 |    ✅/🔴    |
| All → Design     |    ✅/🔴     |     ✅/🔴     |  ✅/🔴   |    ✅/🔴     |     ✅/🔴      |      ✅/🔴      | ✅/🔴 |    ✅/🔴    |
| All → Backlog    |    ✅/🔴     |     ✅/🔴     |  ✅/🔴   |    ✅/🔴     |     ✅/🔴      |      ✅/🔴      | ✅/🔴 |    ✅/🔴    |

---

_Semantic Fidelity Complete → Continuar a Post-Implementation (V3) o Report_
