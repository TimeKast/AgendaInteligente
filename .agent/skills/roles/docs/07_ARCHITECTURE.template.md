# 🏗️ Arquitectura del Sistema - {{PROJECT_NAME}}

> Template para diagrama técnico y decisiones de arquitectura.
> **Generado desde:** Script Canónico §5 (Integraciones) y §8 (Infraestructura)

---

## Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │   Mobile (PWA)   │  │   Web (Browser)  │                 │
│  │   iOS / Android  │  │   Desktop        │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
            └──────────┬──────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Next.js App Router                     │  │
│  │  ┌───────────┐ ┌───────────┐ ┌─────────────────────┐  │  │
│  │  │    RSC    │ │  Server   │ │    API Routes       │  │  │
│  │  │   Pages   │ │  Actions  │ │   /api/v1/*         │  │  │
│  │  └───────────┘ └───────────┘ └─────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌───────────┐ ┌───────────┐ ┌─────────────────────┐  │  │
│  │  │ Middleware│ │   Auth    │ │   Cron Jobs         │  │  │
│  │  │  (Edge)   │ │ (NextAuth)│ │   (Vercel Cron)     │  │  │
│  │  └───────────┘ └───────────┘ └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │     Neon     │  │   Vercel     │  │    External      │  │
│  │   Postgres   │  │    Blob      │  │     APIs         │  │
│  │  (Serverless)│  │  (Storage)   │  │  {{providers}}   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

| Capa           | Tecnología    | Versión | Justificación                         |
| -------------- | ------------- | ------- | ------------------------------------- |
| **Framework**  | Next.js       | 16.0.7+ | App Router, RSC, Server Actions       |
| **Runtime**    | Node.js       | 20+     | LTS, compatible Vercel                |
| **Language**   | TypeScript    | 5.x     | Strict mode obligatorio               |
| **Database**   | Neon Postgres | -       | Serverless, branching para dev        |
| **ORM**        | Drizzle       | Latest  | Type-safe, ligero, SQL-like           |
| **Auth**       | NextAuth v5   | 5.x     | OAuth providers, Magic Link           |
| **UI**         | shadcn/ui     | Latest  | Componentes accesibles, customizables |
| **Styling**    | Tailwind CSS  | 3.x     | Utility-first, design system          |
| **Validation** | Zod           | 3.x     | Schema validation, type inference     |

---

## Integraciones Externas

| Servicio       | Propósito    | Criticidad      | Fallback   |
| -------------- | ------------ | --------------- | ---------- |
| {{Servicio 1}} | {{Para qué}} | 🔴 Crítico      | {{Plan B}} |
| {{Servicio 2}} | {{Para qué}} | 🟡 Importante   | {{Plan B}} |
| {{Servicio 3}} | {{Para qué}} | 🟢 Nice to have | N/A        |

---

## Environments

| Environment | URL                    | Branch | Propósito         |
| ----------- | ---------------------- | ------ | ----------------- |
| Production  | `{{url}}.vercel.app`   | main   | Usuarios reales   |
| Preview     | `{{url}}-*.vercel.app` | PRs    | Review de cambios |
| Development | `localhost:3000`       | -      | Desarrollo local  |

### Variables de Entorno

| Variable               | Descripción            | Requerido | Ejemplo                          |
| ---------------------- | ---------------------- | --------- | -------------------------------- |
| `DATABASE_URL`         | Connection string Neon | ✅        | `postgres://...`                 |
| `NEXTAUTH_SECRET`      | Secret para JWT        | ✅        | `openssl rand -base64 32`        |
| `NEXTAUTH_URL`         | URL de la app          | ✅        | `https://...`                    |
| `GOOGLE_CLIENT_ID`     | OAuth Google           | ✅        | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Google           | ✅        | `GOCSPX-xxx`                     |
| `{{CUSTOM_VAR}}`       | {{Descripción}}        | {{✅/❌}} | {{ejemplo}}                      |

---

## Decisiones de Arquitectura (ADRs)

### ADR-001: {{Título de la decisión}}

| Atributo    | Valor                             |
| ----------- | --------------------------------- |
| **Fecha**   | {{YYYY-MM-DD}}                    |
| **Estado**  | Aceptado / Rechazado / Superseded |
| **Decider** | {{Nombre}}                        |

**Contexto:**
{{Situación que requirió decisión}}

**Decisión:**
{{Qué decidimos hacer}}

**Alternativas consideradas:**

1. {{Alternativa 1}} — ❌ {{Por qué no}}
2. {{Alternativa 2}} — ❌ {{Por qué no}}

**Consecuencias:**

- ✅ {{Beneficio 1}}
- ✅ {{Beneficio 2}}
- ⚠️ {{Trade-off}}

---

## RBAC — Matriz de Permisos

### Roles del Sistema

| Rol           | Descripción                       | Nivel       |
| ------------- | --------------------------------- | ----------- |
| `SUPER_ADMIN` | Acceso total al sistema           | Global      |
| `FUND_ADMIN`  | Administrador de fondo específico | Fund-scoped |
| `MEMBER`      | Participante con acceso limitado  | Fund-scoped |
| `VIEWER`      | Solo lectura                      | Fund-scoped |

### Matriz de Permisos por Módulo

#### Módulo: [Fondos]

| Acción   | SUPER_ADMIN | FUND_ADMIN | MEMBER | VIEWER |
| -------- | :---------: | :--------: | :----: | :----: |
| Crear    |     ✅      |     ❌     |   ❌   |   ❌   |
| Editar   |     ✅      |     ✅     |   ❌   |   ❌   |
| Ver      |     ✅      |     ✅     |   ✅   |   ✅   |
| Eliminar |     ✅      |     ❌     |   ❌   |   ❌   |

#### Módulo: [Movimientos]

| Acción      | SUPER_ADMIN | FUND_ADMIN | MEMBER | VIEWER |
| ----------- | :---------: | :--------: | :----: | :----: |
| Crear       |     ✅      |     ✅     |   ❌   |   ❌   |
| Aprobar     |     ✅      |     ✅     |   ❌   |   ❌   |
| Ver propios |     ✅      |     ✅     |   ✅   |   ✅   |
| Exportar    |     ✅      |     ✅     |   ❌   |   ❌   |

### Permisos Especiales

| Permiso         | Descripción             | Roles       |
| --------------- | ----------------------- | ----------- |
| `BYPASS_LIMITS` | Ignorar límites de rate | SUPER_ADMIN |
| `VIEW_AUDIT`    | Ver audit logs          | SUPER_ADMIN |
| `IMPERSONATE`   | Impersonar usuarios     | SUPER_ADMIN |

---

## Flujos de Datos

### Flujo: {{Nombre del flujo}}

```
1. Usuario hace {{acción}} en UI
   │
   ▼
2. Client Component llama Server Action
   │
   ▼
3. Server Action:
   ├── Valida input con Zod
   ├── Verifica auth con getServerSession()
   └── Ejecuta lógica de negocio
   │
   ▼
4. Drizzle ejecuta query a Neon
   │
   ▼
5. Respuesta al cliente
   │
   ▼
6. UI se actualiza (revalidatePath o return data)
```

---

## Seguridad

### Capas de Protección

| Capa | Implementación     | Qué protege                 |
| ---- | ------------------ | --------------------------- |
| Edge | Middleware         | Rate limiting, geo-blocking |
| Auth | NextAuth           | Sesiones, tokens            |
| API  | Zod validation     | Input malicioso             |
| DB   | Row-level security | Acceso a datos              |

### Headers de Seguridad

```typescript
// next.config.js
headers: [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];
```

---

## Performance

### Estrategia de Caching

| Recurso       | Estrategia      | TTL     |
| ------------- | --------------- | ------- |
| Static assets | CDN             | 1 year  |
| API responses | `Cache-Control` | {{TTL}} |
| DB queries    | React cache()   | Request |

### Métricas Target

| Métrica | Target  | Cómo medir       |
| ------- | ------- | ---------------- |
| LCP     | < 2.5s  | Vercel Analytics |
| FID     | < 100ms | Vercel Analytics |
| CLS     | < 0.1   | Vercel Analytics |
| TTFB    | < 200ms | Vercel Analytics |

---

## Monitoring & Observability

| Herramienta      | Propósito                    |
| ---------------- | ---------------------------- |
| Vercel Analytics | Performance, Core Web Vitals |
| Vercel Logs      | Server-side logs             |
| {{Herramienta}}  | {{Propósito}}                |

---

_Generado con TimeKast Factory_
