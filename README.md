# TimeKast Starter Kit

> 🏭 Template de Next.js con metodología de desarrollo AI-first

**TimeKast Starter Kit** es un template preconfigurado para desarrollar aplicaciones web modernas con una metodología industrializada de desarrollo asistido por AI.

---

## 🚀 Stack Técnico

| Capa          | Tecnología                          |
| ------------- | ----------------------------------- |
| **Framework** | Next.js 16+ (App Router, Turbopack) |
| **Lenguaje**  | TypeScript (strict mode)            |
| **ORM**       | Drizzle ORM                         |
| **Database**  | Neon Postgres (serverless)          |
| **Auth**      | NextAuth.js v5                      |
| **UI**        | Tailwind CSS v4 + Lucide React      |
| **Testing**   | Vitest (unit) + Playwright (E2E)    |
| **Hosting**   | Vercel                              |

---

## 📋 Requisitos Previos

- Node.js 20+
- pnpm 9+
- Cuenta en [Neon](https://neon.tech) (base de datos)
- Cuenta en [Vercel](https://vercel.com) (hosting)

---

## 🏁 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tu-proyecto.git
cd tu-proyecto
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```bash
# Base de datos (obtener de Neon Console)
DATABASE_URL="postgresql://..."

# Auth secret (generar con: openssl rand -base64 32)
AUTH_SECRET="tu-secret-aqui"
```

### 4. Iniciar desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del Proyecto

```
├── src/                      # Todo el código de la aplicación
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes
│   │   ├── (auth)/           # Páginas de autenticación
│   │   ├── (protected)/      # Páginas protegidas (dashboard, settings)
│   │   └── (legal)/          # Páginas públicas (terms, privacy)
│   ├── components/           # Componentes React
│   │   ├── ui/               # Primitivos UI (shadcn/ui)
│   │   ├── common/           # Reutilizables (ErrorBoundary, Footer)
│   │   ├── layout/           # Header, Sidebar, BottomNav
│   │   ├── form/             # Form primitives
│   │   ├── providers/        # Theme, global providers
│   │   └── {feature}/        # Por feature (admin/, dashboard/)
│   ├── lib/                  # Lógica de negocio
│   │   ├── actions/          # Server Actions
│   │   ├── auth/             # NextAuth + password reset
│   │   ├── db/               # Drizzle ORM (schema, queries, migrations)
│   │   ├── email/            # Providers (Resend, SMTP)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── validations/      # Zod schemas
│   │   └── utils/            # Utilidades (cn, etc.)
│   └── config/               # Configuración runtime (roles, branding)
├── .agent/                   # Configuración AI-first
│   ├── workflows/            # Comandos slash (/implement, /design, etc.)
│   ├── skills/               # Domain knowledge (api, db, security, ui)
│   └── rules/                # Reglas del proyecto
├── docs/
│   ├── guides/               # Getting started, project structure
│   ├── reference/            # INVENTORY.md, CODEBASE.md, HOOKS.md (autogenerados)
│   └── backlog/              # Issues y milestones
└── tests/
    ├── unit/                 # Tests unitarios (Vitest)
    └── e2e/                  # Tests E2E (Playwright)
```

> 📖 Convención kit-wide: [`.claude/rules/SK.md §6 Project Structure`](.claude/rules/SK.md) (always-on) + detalle completo en skill [`sk-project-structure`](.claude/skills/sk-project-structure/SKILL.md) (on-demand).

---

## ✨ Features Incluidos

| Feature                   | Descripción                                       |
| ------------------------- | ------------------------------------------------- |
| **3-Theme System**        | Light, Midnight, Dark con CSS variables           |
| **User Profile**          | Edición de nombre y cambio de contraseña in-place |
| **Multi-provider Email**  | Resend API + SMTP genérico                        |
| **OAuth Account Linking** | Google/GitHub pueden vincular a cuenta existente  |
| **Password Reset**        | Vía email o cambio directo desde perfil           |
| **PWA Support**           | Install prompts, offline mode, update toasts      |
| **Magic Link Auth**       | Email-based passwordless login                    |
| **Invite System**         | Invitaciones por email con tokens                 |
| **Rate Limiting**         | Upstash Redis para endpoints de auth              |
| **Super Admin**           | Bootstrap via `pnpm db:seed`                      |

### 📦 Auto-Generación de Catálogos

El proyecto incluye herramientas de auto-documentación que se ejecutan automáticamente:

| Herramienta   | Archivo                          | Comando                   | Trigger            |
| ------------- | -------------------------------- | ------------------------- | ------------------ |
| **INVENTORY** | `project/reference/INVENTORY.md` | `pnpm generate:inventory` | Pre-commit hook    |
| **CODEBASE**  | `project/reference/CODEBASE.md`  | `pnpm generate:codebase`  | Pre-commit hook    |
| **HOOKS**     | `project/reference/HOOKS.md`     | `pnpm generate:hooks`     | Pre-commit hook    |
| **BOARD**     | `project/backlog/BOARD.md`       | `pnpm update-board`       | Al usar `/backlog` |

**INVENTORY** — Catálogo completo auto-generado:

- Dependencias y sus versiones
- Scripts de npm disponibles
- Rutas de páginas y APIs
- Componentes UI por carpeta
- Hooks, utilidades, email templates

**CODEBASE** — Mapa de dependencias entre archivos del repo.

**HOOKS** — Registro canónico de hooks, action helpers, DB helpers, form kit y UI wrappers con nombre, propósito e import path (SSOT para evitar drift de nombres).

**BOARD** — Kanban auto-generado del backlog:

- Agrupa issues por milestone (v1.1, v2.1, etc.)
- Estados: 🚧 In Progress, 📅 To Do, ✅ Done, ⏸️ Postponed, ❌ Won't Do
- Agrupa por epic si existe metadata
- Se actualiza con cada cambio en issues

---

## 🎨 Componentes UI

| Componente      | Descripción                               |
| --------------- | ----------------------------------------- |
| `DataTable`     | Tabla con paginación, sorting, filtros    |
| `TableFilter`   | Dropdown multi/single select para filtros |
| `Pagination`    | Navegación de páginas standalone          |
| `Avatar`        | Avatar con iniciales o imagen             |
| `Badge`         | Status/role badges con colores            |
| `Breadcrumb`    | Navegación breadcrumb automática          |
| `ConfirmDialog` | Modal de confirmación                     |
| `EmptyState`    | Estados vacíos con iconos y acciones      |
| `ThemeToggle`   | Switcher Light/Midnight/Dark              |

---

## 🔧 Scripts Disponibles

### Desarrollo

```bash
pnpm dev              # Servidor de desarrollo (Turbopack)
pnpm build            # Build de producción
pnpm start            # Iniciar build de producción
```

### Verificación

```bash
pnpm lint             # Ejecutar ESLint
pnpm typecheck        # Verificar TypeScript
pnpm test             # Tests unitarios (Vitest)
pnpm test:e2e         # Tests E2E headless (genera reporte HTML)
pnpm test:e2e:ui      # Tests E2E con UI interactivo
pnpm test:coverage    # Coverage de tests unitarios
pnpm verify           # lint + typecheck + test
```

### Base de Datos

```bash
pnpm db:generate      # Generar migration desde schema
pnpm db:migrate       # Aplicar migrations
pnpm db:push          # Push directo (solo desarrollo)
pnpm db:studio        # Abrir Drizzle Studio
pnpm db:seed          # Ejecutar seed (crear super admin)
```

### Utilidades

```bash
pnpm format           # Formatear con Prettier
pnpm lint:fix         # Auto-fix ESLint
pnpm generate:inventory  # Actualizar INVENTORY.md
pnpm generate:codebase   # Actualizar CODEBASE.md (mapa de dependencias)
pnpm generate:hooks      # Actualizar HOOKS.md (registro de hooks/helpers)
pnpm setup:e2e        # Configurar E2E en CI (Neon + GitHub)
```

---

## 🏭 Metodología AI-First

Este template incluye configuración para desarrollo asistido por AI.

> **💡 Al iniciar cada sesión de agente**, ejecuta `/start` para cargar reglas y contexto del proyecto.

### Workflows Disponibles (`.agent/workflows/`)

| Comando              | Descripción                                 |
| -------------------- | ------------------------------------------- |
| `/start`             | Iniciar sesión, cargar contexto             |
| `/discovery`         | Product Discovery interactivo               |
| `/design`            | Generar especificación de diseño            |
| `/docs`              | Generar documentación técnica               |
| `/backlog`           | Gestionar issues del backlog                |
| `/implement`         | Implementar un issue                        |
| `/audit`             | Auditoría de código (lint, tests, security) |
| `/park`              | Capturar ideas para después                 |
| `/consult-architect` | Consultar decisiones técnicas               |
| `/consult-qe`        | Consultar sobre quality/testing             |

### Skills de Dominio (`.agent/skills/domains/`)

| Skill       | Contenido                       |
| ----------- | ------------------------------- |
| `api/`      | Server Actions, API Routes      |
| `db/`       | Drizzle ORM, migrations         |
| `security/` | Auth, validación, rate limiting |
| `testing/`  | Vitest, Playwright              |
| `ui/`       | Componentes, estilos, temas     |

### Reglas AI (`.agent/rules/`)

- NUNCA inventar schemas de DB
- NUNCA hardcodear valores
- Drizzle schema es SSOT
- Verificar antes de marcar completo

> 📖 Ver [`.agent/rules/04_complementary.md`](.agent/rules/04_complementary.md) para reglas completas.

---

## 📄 Archivos de Configuración

| Archivo                | Propósito                        |
| ---------------------- | -------------------------------- |
| `drizzle.config.ts`    | Configuración de Drizzle Kit     |
| `vitest.config.ts`     | Configuración de Vitest          |
| `playwright.config.ts` | Configuración de Playwright      |
| `.agent/rules/`        | Reglas para agentes AI           |
| `.env.example`         | Template de variables de entorno |

---

## 🚨 Pre-Commit Hooks

El proyecto usa Husky + lint-staged para verificar automáticamente:

```bash
✔ ESLint
✔ Prettier
✔ TypeScript
✔ Unit tests afectados
✔ Actualizar INVENTORY.md / CODEBASE.md / HOOKS.md
```

---

## 📚 Documentación

**Del Proyecto:**

- [📖 Getting Started](.claude/docs/getting-started.md) — Setup completo
- [🚀 Deployment](docs/guides/deployment.md) — Deploy a Vercel
- [🔧 Troubleshooting](.claude/docs/troubleshooting.md) — Problemas comunes
- [📦 INVENTORY](project/reference/INVENTORY.md) — Catálogo de componentes
- [🪝 HOOKS](project/reference/HOOKS.md) — Registro de hooks, action helpers, DB helpers, form kit
- [🔐 Security](.claude/skills/sk-security/SKILL.md) — Postura de seguridad (skill)

**Externa:**

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [NextAuth.js Docs](https://authjs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 📝 Licencia

MIT

---

_Generado con TimeKast Factory_
