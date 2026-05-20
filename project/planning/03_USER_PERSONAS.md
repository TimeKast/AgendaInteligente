# 03 — User Personas

> **Source:** [00_DISCOVERY_BRIEF.md §2 Users and Roles](./00_DISCOVERY_BRIEF.md)
> **Namespace:** `P-N`
> **Status:** P-1 primary (≥80% del producto se diseña para él), P-2 secondary (caso de uso compatible)

---

## P-1 — "El múltiple-frentes saturado" (PRIMARY)

### Snapshot

| Atributo                | Valor                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Edad**                | 28-42 (sweet spot 32-38)                                                                                                                                 |
| **Ocupación**           | Profesional con múltiples roles activos: trabajo principal + side project(s) + estudios + responsabilidades personales serias (familia, salud, finanzas) |
| **Tech-savviness**      | Alta. Usuario power de Notion / Linear / Things / Sunsama / Todoist / Obsidian. Probó al menos 3 de estas, ninguna duró 6+ meses.                        |
| **Ingreso**             | Disposable income suficiente para pagar $5-15/mes en software de productividad sin pensarlo.                                                             |
| **Plataforma primaria** | iPhone (60%) o Android premium (35%); desktop solo para trabajo profundo.                                                                                |
| **Idioma**              | Español (LatAm) primario; lee inglés fluido y consume contenido tech en EN.                                                                              |

### Contexto y comportamiento

> "Tengo 14 cosas en la cabeza. Cuando me siento a hacer un Notion lindo es porque ya estoy procrastinando otra cosa. Necesito una herramienta que me agarre del cuello, no una que me espere."

**Jornada típica:**

- 7:00 — despierta, scrollea WhatsApp/email en la cama, ya está atrasado mentalmente
- 8:00-12:00 — trabajo profundo _si tiene suerte_; típicamente bloqueado por meetings o messages urgentes
- 12:00-14:00 — lunch + tareas administrativas (responder emails, pagar cosas, llamadas)
- 14:00-19:00 — segundo bloque de trabajo + meetings tarde
- 19:00-22:00 — vida personal: familia/pareja, gym, side project, estudio
- 22:00-23:00 — debería dormir, hace scroll de TikTok/Twitter, se siente culpable

**Frentes activos simultáneos (típico):**

1. Trabajo principal (3-5 proyectos paralelos)
2. Side project (1 que sostiene + 1-2 que abandonó culpa-mente)
3. Estudio (curso online a medio terminar, libro a medio leer)
4. Salud (gym intermitente, dieta intermitente, doctor pendiente)
5. Finanzas personales (taxes pendientes, inversiones a revisar)
6. Familia/pareja (eventos, llamadas, fechas importantes)
7. Hobbies declarados pero no practicados

### Goals (lo que quiere lograr en su vida)

| #   | Goal                                                     | Cómo se ve cuando lo logra                                               |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| G-1 | Sentir que tiene control sobre su tiempo, no al revés    | Domingo sabe qué fueron los 7 días anteriores y qué viene                |
| G-2 | Sostener proyectos importantes >3 meses sin abandonarlos | El side project que abandonó hace 8 meses está vivo                      |
| G-3 | No olvidarse de cosas mundanas (pagar, llamar, agendar)  | Cero crisis "me olvidé del cumpleaños/factura/cita médica"               |
| G-4 | Sentir que cierra el día/semana en paz, no en deuda      | Sábado nocturno no piensa "qué desastre fue la semana"                   |
| G-5 | Avanzar concretamente hacia metas largas (5 años)        | Las decisiones de la semana se conectan con dónde quiere estar en 5 años |

### Pain points (qué falla hoy)

| #    | Pain                                            | Manifestación                                                                                                                                                                          |
| ---- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PP-1 | **Olvidos sistemáticos**                        | Pago tarde una factura. Olvida cumpleaños. Falta a cita médica. Le manda mensaje a contacto importante 3 semanas tarde.                                                                |
| PP-2 | **Falta de planeación recurrente**              | Las semanas que planeó (raras) rindió mucho mejor. Pero no sostiene el hábito de planear; lo intenta 2 semanas y abandona.                                                             |
| PP-3 | **Apps pasivas que se vuelven cementerios**     | Abrió Notion, Todoist, TickTick, Things. Todas se llenaron de 200 tareas, dejó de abrirlas. Quedaron como recordatorio de su propia disfunción.                                        |
| PP-4 | **Captura friction**                            | Cuando se le ocurre algo manejando o en la regadera, NO lo anota porque sacar el celular y abrir la app y elegir proyecto y categoría y... ya se olvidó.                               |
| PP-5 | **No entiende por qué falla**                   | Termina la semana sintiendo "no rendí" pero no sabe identificar qué pasó concretamente. Sin diagnóstico, no aprende. Repite el mismo patrón mes a mes.                                 |
| PP-6 | **Goals largo plazo sin tracción**              | Tiene goals declarados (aprender alemán, escribir un libro, lanzar producto). Cero acciones concretas semanales hacia ellos. Sabe que están abandonados, no sabe cómo reconectarlos.   |
| PP-7 | **Saturación emocional con productividad porn** | Consumió Cal Newport, GTD, Atomic Habits, BJ Fogg. Sabe TODA la teoría. No la aplica. Sospecha que el problema es que necesita un sistema externo que lo obligue, no más conocimiento. |

### Triggers de uso (cuándo abriría la app)

- Notificación push de la app a las 8am ("¿cuál es la intención de hoy?")
- Necesita capturar algo rápido manejando o caminando → mic button
- Sábado nocturno: review semanal forzado (¡o el domingo si saltó el sábado!)
- Una idea aleatoria de un proyecto → dictado por voz, 2 segundos
- Llegó tarde a algo o le falló → quiere saber "¿qué dejé de hacer ayer?"

### Triggers de abandono (cuándo dejaría de usar la app)

- Si la app deja de buscarlo activamente → vuelve a ser una más
- Si la captura por voz tiene fricción >3 segundos
- Si los check-ins se sienten genéricos ("¿cómo te sentís hoy?" sin contexto)
- Si la IA acepta respuestas vagas y no las desafía → se da cuenta de que no está rindiendo nada
- Si la app le manda 10 notificaciones al día (overload) → mute permanente
- Si no puede ajustar horarios de check-ins a su realidad

### Quote característica

> "La verdad necesito una app que sea como un amigo molesto que me pregunte '¿hiciste lo que dijiste que ibas a hacer?' y que no acepte 'eh, más o menos' como respuesta."

### Diseño implications (cómo P-1 fuerza decisiones del producto)

| Implicación                            | Decisión de producto resultante                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| P-1 quiere captura ultra-rápida        | Mic-first, parser por voz, 1-tap confirm (FT-070..075)                                   |
| P-1 ha probado todo, conoce el espacio | Diferenciadores deben ser claros desde primera pantalla (no vender lo mismo que Todoist) |
| P-1 abandona apps pasivas              | Check-ins automáticos forzados son P0 (FT-080..087)                                      |
| P-1 no entiende sus fallas             | Razón de no cumplimiento + post-mortem auto (FT-028, FT-103) son P1                      |
| P-1 tiene goals largos sin tracción    | Goals como entidad separada con linkage M2M a actividades (FT-040..043)                  |
| P-1 sabe la teoría, no la aplica       | Voz del agente: directa, sin coaching motivacional ("¡tú puedes!")                       |
| P-1 satura fácilmente                  | Anti-spam guardrails (FT-086) son P1                                                     |

---

## P-2 — "Transición vital estructurada" (SECONDARY)

### Snapshot

| Atributo                | Valor                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Edad**                | 25-50 (más variable)                                                                                                                                                                          |
| **Contexto**            | Atravesando transición vital significativa: cambio de carrera, divorcio/breakup, post-pérdida, nuevo padre/madre, recuperación de adicción, mudanza internacional, retiro de tipo de trabajo. |
| **Tech-savviness**      | Media a alta. Puede no ser power user pero está dispuesto a aprender.                                                                                                                         |
| **Ingreso**             | Variable; importante: dispuesto a invertir en herramientas de auto-mejora si percibe valor.                                                                                                   |
| **Plataforma primaria** | Mobile primary, no usa desktop para esto.                                                                                                                                                     |
| **Idioma**              | Español o inglés indistinto.                                                                                                                                                                  |

### Contexto

> "Necesito estructura porque mi vida acaba de perder la estructura que tenía. No quiero coaching. Quiero un sistema."

P-2 está en un período de 90-180 días donde busca activamente herramientas de auto-organización. Ha leído más de un libro de auto-ayuda en los últimos 6 meses. Considera contratar coach pero piensa "demasiado caro / no creo en eso / quiero hacerlo solo".

### Goals

| #   | Goal                                              | Cómo se ve cuando lo logra                                                  |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| G-1 | Estructurar el caos de la transición              | Tiene una rutina semanal estable que sigue                                  |
| G-2 | Reflexionar sin caer en rumination                | Escribe sus pensamientos en sheets sin obsesionarse                         |
| G-3 | Definir quién quiere ser después de la transición | Identity sheet de Life es ejercicio importante                              |
| G-4 | Tomar decisiones grandes con base, no impulsivas  | Quarter sheet lo ayuda a no decidir cambios de carrera en martes a las 11pm |

### Pain points

| #    | Pain                                                                                    |
| ---- | --------------------------------------------------------------------------------------- |
| PP-1 | Apps de productividad genéricas no entienden que está en transición                     |
| PP-2 | Journaling libre lo lleva a rumination                                                  |
| PP-3 | Coaching cuesta $500/mes y desconfía                                                    |
| PP-4 | Su ciclo natural es más reflexivo que ejecutivo, necesita herramientas que respeten eso |

### Diseño implications

| Implicación                            | Decisión                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| P-2 necesita reflexión sin rumination  | Intensity mode "Listening" (no challenges 48h) es clave para días duros (FT-052)         |
| P-2 valora estructura de scopes largos | 5-Year y Life sheets (v2 FT-300, FT-301) son lo que lo retiene                           |
| P-2 puede ser más casual en captura    | Voice capture no es tan crítica como en P-1                                              |
| P-2 lee microcopy literalmente         | "Welcome back" vs "¡Hola de nuevo!" — voz neutra profesional respeta su estado emocional |

### Quote característica

> "Estoy pasando por una mierda. No me digas '¡tú puedes!'. Solo preguntame qué quiero que esta semana se parezca."

---

## P-3 — "El planner pro que ya tiene sistema" (ANTI-PERSONA, NO target)

### Snapshot

Profesional 35-55 con sistema de productividad maduro: Sunsama + Things + custom Notion + tiempo bloqueado en calendar. Ya resolvió su gestión de tiempo.

### Por qué NO es target

- No tiene el pain point principal (olvidos, falta de planeación)
- No abandona apps de productividad
- Le sobra el agente IA que pregunta — él ya sabe qué quiere
- Es excelente refoma de feedback técnico pero no se convertiría en pagador del valor del producto

### Implicación

No diseñar UI/onboarding/marketing pensando en P-3. Si P-3 se convierte, bien; si no, no es problema.

---

## P-4 — "Estudiante universitario" (ANTI-PERSONA, NO target en MVP)

### Snapshot

18-24, plataforma Android low/mid range, presupuesto $0, busca apps gratis.

### Por qué NO es target en MVP

- No puede/quiere pagar SaaS subscription
- Su problema de productividad es estudio + procrastinación de tipo distinto
- Patrones de uso muy distintos (Discord/TikTok/no email)
- Tier free los acepta pero no convierten

### Implicación

OK que usen tier free indefinidamente. No invertir en features específicas para ellos (ej: integración con Notion académico, Pomodoro timers, study sessions).

---

## Cobertura

| Persona | % features MVP que sirven a este persona                                                |
| ------- | --------------------------------------------------------------------------------------- |
| P-1     | 100% (producto diseñado primariamente para él)                                          |
| P-2     | ~75% (las 6 escalas largas + Listening mode + warm-book aesthetic le sirven en v1.5/v2) |
| P-3     | ~40% (le sobra el AI agent, podría usar core de tareas)                                 |
| P-4     | ~30% (free tier le alcanza para tareas básicas)                                         |

### Decisión

**Todo conflicto de diseño se resuelve a favor de P-1.** Si una decisión beneficia a P-2/P-3/P-4 pero degrada experiencia de P-1, se rechaza.

---

_Generated by `/docs` Batch 1 — 2026-05-19_
