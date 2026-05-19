---
name: ui
description: React/Next.js UI components, Tailwind styling, client interactivity
---

# 🎨 UI Skill

> **Dominio:** Componentes, estilos, interactividad.
> **Stack:** React 19, Next.js App Router, Tailwind CSS, shadcn/ui.

---

## Principios Fundamentales

1. **Server Components por defecto** — `'use client'` solo cuando necesario
2. **Composición sobre herencia** — componentes pequeños y reutilizables
3. **Tailwind first** — evitar CSS custom salvo casos excepcionales
4. **Accesibilidad siempre** — ARIA, keyboard nav, focus management

---

## Cuándo Usar Client Components

| ✅ Usar `'use client'`   | ❌ Mantener Server Component |
| ------------------------ | ---------------------------- |
| useState, useEffect      | Fetch de datos               |
| Event handlers (onClick) | Renderizado estático         |
| Browser APIs             | Acceso a DB/filesystem       |
| Interactividad usuario   | Componentes sin estado       |

---

## Estructura de Componentes

```
/components
  /ui              # shadcn/ui primitives (no modificar)
  /common          # Componentes compartidos del proyecto
  /[feature]       # Componentes específicos por feature
```

### Patrón de Componente

```typescript
// components/users/UserCard.tsx
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  className?: string;
}

export function UserCard({ user, className }: UserCardProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>
    </Card>
  );
}
```

---

## Tailwind Patterns

### Responsive Design

```tsx
// Mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Dark Mode

```tsx
// Usa clases de Tailwind, theme se maneja automáticamente
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

### ⚠️ Valores Arbitrarios vs Clases Predefinidas

**SIEMPRE preferir clases predefinidas de Tailwind sobre valores arbitrarios.**

| ❌ Evitar | ✅ Usar | Equivalencia |
|-----------|---------|--------------||
| `w-[150px]` | `w-40` | 10rem = 160px |
| `w-[180px]` | `w-44` | 11rem = 176px |
| `w-[200px]` | `w-50` | 12.5rem = 200px |
| `max-w-[400px]` | `max-w-100` | 25rem = 400px |
| `min-w-[200px]` | `min-w-52` | 13rem = 208px |
| `h-[300px]` | `h-75` | 18.75rem = 300px |
| `gap-[20px]` | `gap-5` | 1.25rem = 20px |
| `p-[16px]` | `p-4` | 1rem = 16px |

**¿Por qué?**

1. **Bundle más pequeño** — Valores arbitrarios generan CSS extra
2. **Design system consistente** — Sigue la escala de espaciado de Tailwind
3. **Mantenibilidad** — Cambios globales se propagan automáticamente
4. **Mejor IDE support** — Autocompletado y sugerencias

**Escala de referencia (Tailwind v4):**

```
4  = 1rem   = 16px     40 = 10rem   = 160px
8  = 2rem   = 32px     44 = 11rem   = 176px
12 = 3rem   = 48px     48 = 12rem   = 192px
16 = 4rem   = 64px     52 = 13rem   = 208px
20 = 5rem   = 80px     56 = 14rem   = 224px
24 = 6rem   = 96px     60 = 15rem   = 240px
28 = 7rem   = 112px    64 = 16rem   = 256px
32 = 8rem   = 128px    72 = 18rem   = 288px
36 = 9rem   = 144px    80 = 20rem   = 320px
                       96 = 24rem   = 384px
                       100 = 25rem  = 400px
```

**Excepción:** Valores muy específicos de diseño (ej: `w-[37px]` para un icono exacto) son aceptables si no hay clase cercana.

### Estados Interactivos

```tsx
<button className="
  bg-primary text-primary-foreground
  hover:bg-primary/90
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
  disabled:pointer-events-none disabled:opacity-50
">
```

---

## Formularios

### Con React Hook Form + Zod

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Mínimo 2 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

export function UserForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', name: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Table Patterns

### Hook Selection

| Hook                  | Use Case                | Data Size | State Location |
| --------------------- | ----------------------- | --------- | -------------- |
| `useTableState`       | Catalogs, local editing | <100 rows | Client memory  |
| `useServerTableState` | Logs, transactions      | 100+ rows | URL params     |

### Sorting: 3-State Cycle

Clicking a column header cycles through:

| State  | Visual              | Description    |
| ------ | ------------------- | -------------- |
| `null` | ↕️ (faint on hover) | Original order |
| `asc`  | ↑                   | Ascending      |
| `desc` | ↓                   | Descending     |

### Client-Side Example

```tsx
import { useTableState } from '@/lib/hooks/useTableState';

const { paginatedData, onSort, getSortDirection, setSearch } = useTableState({
  data: products,
  searchableColumns: ['name', 'sku'],
  pageSize: 20,
});
```

### Server-Side Example

```tsx
import { useServerTableState } from '@/lib/hooks/useServerTableState';

const { sort, dir, page, setSort, setPage } = useServerTableState({
  defaultLimit: 20,
});

// URL params: ?sort=name&dir=asc&page=2
```

### When to Use

| Scenario                     | Recommended Hook      |
| ---------------------------- | --------------------- |
| Product catalog (<100 items) | `useTableState`       |
| Transaction history          | `useServerTableState` |
| Editable inline tables       | `useTableState`       |
| Shareable/bookmarkable URLs  | `useServerTableState` |

---

## Editable Tables UX

### 1. "Agregar" Button Placement

```
┌────────────────────────────────────────────────────────┐
│ [🔍 Buscar...]                        [+ Agregar]      │ ← Header
├────────────────────────────────────────────────────────┤
│ | Col A | Col B | Col C | Actions |                    │
│ |-------|-------|-------|---------|                    │
│ | ...   | ...   | ...   | [✏️][🗑️] |                    │
├────────────────────────────────────────────────────────┤
│                              [+ Agregar Fila]          │ ← O aquí si inline
└────────────────────────────────────────────────────────┘
```

**Regla:** Botón "Agregar" en header si abre modal/página, en footer si inline.

### 2. Column Widths

| Tipo de Columna | Width              |
| --------------- | ------------------ |
| Checkbox        | `w-12`             |
| Avatar/Icon     | `w-12`             |
| Short text      | `w-32`             |
| Name/Title      | `flex-1` (fill)    |
| Number          | `w-24` right-align |
| Date            | `w-32`             |
| Status badge    | `w-24`             |
| Actions         | `w-24` right-align |

### 3. Row Highlights

```tsx
<tr className={cn(
  row.hasError && 'bg-destructive/10',
  row.hasWarning && 'bg-warning/10',
  row.isSelected && 'bg-primary/10',
)}>
```

| Estado   | Color                     |
| -------- | ------------------------- |
| Error    | `bg-destructive/10` (red) |
| Warning  | `bg-warning/10` (yellow)  |
| Selected | `bg-primary/10`           |
| Hover    | `hover:bg-muted`          |

### 4. Action Tooltips

**Siempre usar tooltips en icon buttons:**

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">
      <Pencil className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Editar</TooltipContent>
</Tooltip>
```

---

## Loading States

### Suspense Boundaries

```tsx
// app/(dashboard)/users/page.tsx
import { Suspense } from 'react';
import { UserList } from '@/components/users/UserList';
import { UserListSkeleton } from '@/components/users/UserListSkeleton';

export default function UsersPage() {
  return (
    <Suspense fallback={<UserListSkeleton />}>
      <UserList />
    </Suspense>
  );
}
```

### Skeleton Pattern

````tsx
// components/users/UserListSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function UserListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
---

## Identificadores en UI

> **REGLA CRÍTICA:** NUNCA mostrar UUIDs a usuarios finales.

### ❌ Prohibido

- UUIDs en breadcrumbs: `Pedido / 550e8400-e29b-41d4-a716-44...`
- UUIDs en tablas: columna ID mostrando `f47ac10b-58cc...`
- UUIDs en mensajes: "Tu pedido 550e8400-e29b-41d4 ha sido creado"
- UUIDs en URLs: `/orders/550e8400-e29b-41d4-a716-446655440000`
- UUIDs en reportes PDF/Excel
- UUIDs en emails

### ✅ Usar siempre

- Human IDs: `ORD-2026-0042`, `USR-0001`, `TKT-2026-0123`
- Ver helper: `@/lib/utils/human-id`

### Dónde aplica

| Contexto               | Mostrar           | Usar internamente |
| ---------------------- | ----------------- | ----------------- |
| Breadcrumbs            | `ORD-2026-0042`   | uuid (hidden)     |
| Tablas                 | `orderNumber`     | `id` para queries |
| URLs                   | `/orders/ORD-...` | lookup por human  |
| Mensajes toast         | Human ID          | —                 |
| Emails transaccionales | Human ID          | —                 |
| Reportes               | Human ID          | —                 |
| Soporte telefónico     | Human ID          | —                 |

### Por qué importa

- **UX:** Los usuarios no pueden recordar/dictar UUIDs
- **Soporte:** "¿Me das tu número de pedido?" debe ser fácil de responder
- **Profesionalismo:** UUIDs lucen como errores o bugs

---

## Breadcrumb Context (Dynamic Labels)

Cuando una página tiene params dinámicos (UUIDs, IDs), usar `BreadcrumbSetter` para mostrar nombres legibles en el breadcrumb.

### Uso Básico

```tsx
// app/(protected)/users/[id]/page.tsx
import { BreadcrumbSetter } from '@/components/common/BreadcrumbSetter';

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);

  return (
    <>
      <BreadcrumbSetter segment={id} label={user.name} />

      <h1>{user.name}</h1>
    </>
  );
}
````

**Resultado:** Breadcrumb muestra `Users > John Doe` en vez de `Users > abc-123-uuid`

### Arquitectura

| Componente            | Path                                     | Propósito         |
| --------------------- | ---------------------------------------- | ----------------- |
| `BreadcrumbProvider`  | `lib/contexts/BreadcrumbContext.tsx`     | Provider global   |
| `BreadcrumbSetter`    | `components/common/BreadcrumbSetter.tsx` | Setea label       |
| `useBreadcrumbLabels` | `lib/contexts/BreadcrumbContext.tsx`     | Hook para acceder |

### ⚠️ Reglas

1. **Siempre usar en páginas con params dinámicos**
2. **Un setter por segment**
3. **Renderiza null** — solo side effect

---

## URL State con Search Params

```typescript
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useQueryState(key: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key);

  const setValue = useCallback(
    (newValue: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (newValue === null) {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [key, pathname, router, searchParams]
  );

  return [value, setValue] as const;
}
```

---

## Accesibilidad Checklist

- [ ] Todos los `<img>` tienen `alt`
- [ ] Formularios tienen `<label>` asociados
- [ ] Botones interactivos son `<button>`, no `<div>`
- [ ] Links de navegación son `<a>` o `<Link>`
- [ ] Focus visible en elementos interactivos
- [ ] Contraste suficiente (WCAG AA mínimo)
- [ ] Keyboard navigation funciona
- [ ] Screen reader friendly

## Diálogos y Feedback al Usuario

### ⚠️ NUNCA Usar Diálogos Nativos del Browser

Los diálogos nativos (`alert()`, `confirm()`, `prompt()`) se ven **horribles** y rompen la experiencia de usuario.

| ❌ PROHIBIDO          | ✅ USAR EN SU LUGAR     |
| --------------------- | ----------------------- |
| `alert('Error')`      | Toast con `sonner`      |
| `confirm('¿Seguro?')` | `AlertDialog` de shadcn |
| `prompt('Nombre:')`   | Modal con form          |
| `window.confirm()`    | Custom dialog component |

### Componentes Disponibles en Starter Kit

```tsx
// Para confirmaciones destructivas
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Para notificaciones
import { toast } from 'sonner';

// Para modales de input
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
```

### Mensajes Siempre Human-Readable

| ❌ NUNCA mostrar        | ✅ SIEMPRE mostrar                             |
| ----------------------- | ---------------------------------------------- |
| `Error: ECONNREFUSED`   | "No pudimos conectar. Intenta de nuevo."       |
| `TypeError: undefined`  | "Algo salió mal. Por favor recarga la página." |
| `404 Not Found`         | "No encontramos lo que buscas."                |
| Stack trace / traceback | Mensaje amigable + log interno                 |

**Patrón para errores:**

```tsx
try {
  await deleteUser(id);
  toast.success('Usuario eliminado correctamente');
} catch (error) {
  console.error('Delete user failed:', error); // Log técnico
  toast.error('No pudimos eliminar el usuario. Intenta de nuevo.'); // Mensaje amigable
}
```

### Ejemplo: Confirmación de Borrado

```tsx
// ❌ MAL - Diálogo nativo feo
function handleDelete() {
  if (confirm('¿Seguro que quieres eliminar?')) {
    deleteItem(id);
  }
}

// ✅ BIEN - AlertDialog bonito
function DeleteButton({ itemId }: { itemId: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Eliminar</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este elemento?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteItem(itemId)}>Sí, eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## React Best Practices

### Derived State vs Managed State

**❌ Anti-pattern (sync issues):**

```tsx
// BAD: estado se desincroniza de props
const [items, setItems] = useState(props.items);

useEffect(() => {
  setItems(props.items);
}, [props.items]);
```

**✅ Correct (derived):**

```tsx
// GOOD: siempre derivado de props
const items = useMemo(() => processItems(props.items), [props.items]);
```

---

### Unique Keys in Lists

**❌ Anti-pattern:**

```tsx
{
  items.map((item) => <Item key={item.name} />);
} // keys pueden repetirse
```

**✅ Correct:**

```tsx
{
  items.map((item, index) => <Item key={item.id ?? `item-${index}`} />);
}
```

---

### Avoiding Stale Closures

**❌ Anti-pattern:**

```tsx
const handleClick = () => {
  console.log(count); // Siempre el valor inicial
};
```

**✅ Correct:**

```tsx
const handleClick = useCallback(() => {
  setCount((prev) => prev + 1);
}, []);
```

---

## Known Issues

> Issues conocidos de dependencias que no tienen fix. Documentados para evitar duplicar investigación.

### 1. Radix Select Hydration Warnings

**Síntoma:**

```
Warning: Prop 'id' did not match. Server: "radix-:r1:" Client: "radix-:r2:"
```

**Causa:** Radix genera IDs dinámicos que no coinciden entre server y client.

**Workaround:**

```tsx
// Opción 1: suppressHydrationWarning
<div suppressHydrationWarning>
  <Select>...</Select>
</div>;

// Opción 2: dynamic import con ssr: false
const Select = dynamic(() => import('@radix-ui/react-select'), { ssr: false });
```

**Status:** [radix-ui/primitives#2699](https://github.com/radix-ui/primitives/issues/2699)

---

### 2. Sonner Toast Position on Mobile

**Síntoma:** Toast puede quedar cubierto por soft keyboard en mobile.

**Workaround:**

```tsx
<Toaster position="top-center" /> // En lugar de bottom
```

---

### 3. Next.js App Router Scroll Restoration

**Síntoma:** Scroll position no se restaura al volver con back button.

**Workaround:**

```tsx
// next.config.ts
experimental: {
  scrollRestoration: true,
}
```

**Status:** [vercel/next.js#46682](https://github.com/vercel/next.js/issues/46682)

---

## Anti-Patrones

| ❌ Evitar                          | ✅ Preferir               |
| ---------------------------------- | ------------------------- |
| `<div onClick>`                    | `<button onClick>`        |
| Inline styles                      | Tailwind classes          |
| CSS modules                        | Tailwind / cn()           |
| Prop drilling profundo             | Context o composition     |
| useEffect para fetch               | Server Component + async  |
| Estado global para todo            | URL state cuando posible  |
| `alert()`, `confirm()`, `prompt()` | Toast, AlertDialog, Modal |
| Mostrar errores técnicos           | Mensajes human-readable   |

---

## SIEMPRE / NUNCA

**SIEMPRE:**

- Usar componentes del design system (`@/components/ui/`) antes de crear nuevos
- Mobile-first: estilos base = mobile, breakpoints para desktop
- Verificar accesibilidad: contrast, focus states, keyboard nav
- Usar `cn()` para merge de clases con variantes
- Preferir clases predefinidas de Tailwind sobre valores arbitrarios

**NUNCA:**

- `alert()`, `confirm()`, `prompt()` — usar Toast/AlertDialog
- Inline styles sin justificación documentada
- `!important` sin documentar razón
- Crear componentes sin verificar INVENTORY.md
- Mostrar UUIDs a usuarios — usar human IDs
- `<div onClick>` — usar `<button>` para interactividad

---

## 🔗 Colaboración

| Con         | Cuándo                         | Acción                            |
| ----------- | ------------------------------ | --------------------------------- |
| **design**  | Specs de componentes nuevos    | Consultar 15_DESIGN.md            |
| **testing** | Tests de accesibilidad, E2E UI | Cargar `domains/testing/SKILL.md` |
| **api**     | Server Actions para forms      | Coordinar                         |

---

_Skill de dominio del TimeKast Factory_
