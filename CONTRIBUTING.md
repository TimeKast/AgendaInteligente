# Contributing to TimeKast Starter Kit

> Guía para contribuir al proyecto.

¡Gracias por tu interés en contribuir! Este documento describe el proceso y las convenciones para contribuir al TimeKast Starter Kit.

---

## Getting Started

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub

# Clone tu fork
git clone https://github.com/TU-USUARIO/timekast-starter-kit.git
cd timekast-starter-kit

# Agregar upstream
git remote add upstream https://github.com/TimeKast/timekast-starter-kit.git
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Development Environment

```bash
# Copiar variables de entorno
cp .env.example .env.local

# Configurar DATABASE_URL y AUTH_SECRET
# Ver .claude/docs/getting-started.md para detalles
```

### 4. Create Feature Branch

```bash
# Sincronizar con upstream
git fetch upstream
git checkout main
git merge upstream/main

# Crear branch para tu feature
git checkout -b feature/nombre-descriptivo
```

---

## Development Tools (DX)

Hemos configurado herramientas para mejorar tu experiencia de desarrollo:

### 🐛 Visual Studio Code Debugging

El proyecto incluye `.vscode/launch.json` con configuraciones predefinidas:

1.  Ve a la pestaña **Run and Debug** (Cmd+Shift+D).
2.  Selecciona una configuración:
    - **Next.js: debug server-side**: Para API routes y Server Components.
    - **Next.js: debug client-side**: Abre Chrome para debuggear Client Components.
    - **Vitest: debug current file**: Debuggea el test que tengas abierto.
3.  Pon breakpoints y presiona F5. 🛑

### 🧹 Linting Estricto

ESLint está configurado para mantener el código limpio:

- **Console Logs:** Te avisará si dejas `console.log`. Úsalo para debug, bórralo para commit.
- **Unused Vars:** Si no usas una variable, el linter se quejará.
  - _Tip:_ Prefija con `_` si es intencional (ej. `_req`).
- **No Any:** Evita usar `any`. TypeScript es tu amigo.

---

## Quality Gates

Antes de crear un PR, asegúrate de que todo pasa:

```bash
# Ejecutar todas las verificaciones
pnpm verify
```

Este comando ejecuta:

- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript strict
- `pnpm test` — Vitest unit tests

### Pre-Commit Hook

El proyecto incluye un pre-commit hook via Husky que ejecuta `lint-staged`:

- Prettier en archivos modificados
- ESLint en archivos `.ts` y `.tsx`

---

## Commit Convention

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para mensajes de commit claros y generación automática de changelog.

### Formato

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Cuándo usar                         |
| ---------- | ----------------------------------- |
| `feat`     | Nueva feature                       |
| `fix`      | Bug fix                             |
| `docs`     | Solo documentación                  |
| `style`    | Formateo, sin cambio de código      |
| `refactor` | Cambio de código sin fix ni feature |
| `test`     | Agregar o corregir tests            |
| `chore`    | Tareas de mantenimiento             |
| `perf`     | Mejora de performance               |
| `ci`       | Cambios en CI/CD                    |

### Scope (Opcional)

Indica el área afectada:

- `auth` — Autenticación
- `db` — Base de datos
- `ui` — Componentes UI
- `api` — API routes
- `pwa` — Progressive Web App
- `email` — Sistema de email

### Ejemplos

```bash
# Feature nueva
git commit -m "feat(auth): add magic link support"

# Bug fix
git commit -m "fix(ui): correct theme toggle in mobile view"

# Documentación
git commit -m "docs: update deployment guide for Neon branches"

# Breaking change (usar footer)
git commit -m "feat(api)!: change user endpoint response format

BREAKING CHANGE: user.fullName is now user.name"
```

---

## Pull Request Process

### 1. Antes de Crear el PR

- [ ] Branch actualizado con `main`
- [ ] `pnpm verify` pasa completamente
- [ ] Tests escritos para cambios nuevos
- [ ] Documentación actualizada si es necesario

### 2. PR Template

Al crear un PR, usa esta estructura:

```markdown
## What

Breve descripción de los cambios.

## Why

Contexto y motivación. ¿Qué problema resuelve?

## How

Approach de implementación si no es obvio.

## Testing

- [ ] Unit tests agregados/actualizados
- [ ] E2E tests agregados/actualizados
- [ ] Manual testing realizado

## Screenshots

(Si hay cambios de UI)

## Checklist

- [ ] `pnpm verify` pasa
- [ ] Documentación actualizada
- [ ] Changelog entry agregado (si aplica)
```

### 3. Review Process

- Un reviewer debe aprobar antes de merge
- CI debe pasar (lint, typecheck, tests)
- Squash merge preferido para mantener historial limpio

---

## Code Style

### TypeScript

- **Strict mode** — No `any` types
- **Explicit types** — En function parameters y returns
- **Zod validation** — En API boundaries

```typescript
// ✅ Correcto
function getUserById(id: string): Promise<User | null> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

// ❌ Incorrecto
function getUserById(id: any) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
```

### React Components

- **Server Components por defecto** — Solo `'use client'` cuando necesario
- **Props interface** — Siempre definir interface para props
- **cn() utility** — Para conditional classes

```typescript
// ✅ Correcto
interface UserCardProps {
  user: User;
  className?: string;
}

export function UserCard({ user, className }: UserCardProps) {
  return (
    <div className={cn('rounded-lg p-4', className)}>
      {user.name}
    </div>
  );
}
```

### Tailwind CSS

- **Classes predefinidas** — Evitar valores arbitrarios (`w-[150px]`)
- **Design system tokens** — Usar CSS variables del theme
- **Mobile-first** — Responsive con breakpoints `md:`, `lg:`

```typescript
// ✅ Correcto
<div className="w-40 md:w-60 lg:w-80 p-4">

// ❌ Evitar
<div className="w-[150px] md:w-[240px] lg:w-[320px] p-[16px]">
```

### Imports

Orden de imports:

1. React/Next.js
2. Third-party libraries
3. Internal modules (`@/lib/...`)
4. Relative imports

```typescript
// 1. React/Next
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party
import { z } from 'zod';

// 3. Internal
import { db } from '@/lib/db/drizzle';
import { Button } from '@/components/ui/button';

// 4. Relative
import { UserCard } from './UserCard';
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Ejecutar todos
pnpm test

# Watch mode
pnpm test:watch

# Con coverage
pnpm test:coverage
```

Location: `tests/unit/`

### E2E Tests (Playwright)

```bash
# Ejecutar todos
pnpm test:e2e

# Con UI
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug
```

Location: `tests/e2e/`

### Escribiendo Tests

```typescript
// tests/unit/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/utils';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-01-15');
    expect(formatDate(date)).toBe('January 15, 2025');
  });
});
```

---

## Documentation

Al agregar features nuevas:

1. **Actualizar README.md** si es feature visible
2. **Agregar a CHANGELOG.md** bajo `## [Unreleased]`
3. **Crear/actualizar docs** en `docs/` si es necesario

---

## Need Help?

- 📖 **Docs:** Revisa `docs/` para guías detalladas
- 🐛 **Issues:** Abre un issue para bugs o feature requests
- 💬 **Discussions:** Usa GitHub Discussions para preguntas

---

## License

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la misma licencia del proyecto (MIT).

---

_TimeKast Starter Kit — Contributing Guide_
