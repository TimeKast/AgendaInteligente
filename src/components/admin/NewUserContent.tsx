'use client';

/**
 * NewUserContent Component
 *
 * Full-page create form for new users.
 * Sets breadcrumb, renders header and form.
 * On success redirects to users list. On cancel navigates back.
 *
 * @see UXUI-009
 * @see crud-scaffold.md Layer 9
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BreadcrumbSetter } from '@/components/common/BreadcrumbSetter';
import { createUser } from '@/lib/actions/admin/user-admin';
import { getAssignableRoles, getRoleDisplayName, ROLES } from '@/config/roles';
import { toast } from 'sonner';
import { createUserSchema } from '@/lib/validations/admin/user-admin';
import { useUnsavedChangesGuard } from '@/lib/hooks/useUnsavedChangesGuard';

// =============================================================================
// Types
// =============================================================================

type CreateFormData = z.infer<typeof createUserSchema>;

interface NewUserContentProps {
  currentUserRole: string;
}

// =============================================================================
// Component
// =============================================================================

export function NewUserContent({ currentUserRole }: NewUserContentProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get assignable roles
  const assignableRoles = getAssignableRoles(currentUserRole);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: ROLES.USER,
      password: '',
    },
  });
  const { confirmNavigation, allowNavigation } = useUnsavedChangesGuard({
    isDirty,
    disabled: isSubmitting,
  });

  // Handle submit — redirects to list on success
  async function onSubmit(data: CreateFormData) {
    setIsSubmitting(true);

    try {
      const result = await createUser(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Usuario creado correctamente');
        allowNavigation(() => router.push('/settings/users'));
      }
    } catch (error) {
      console.error('[NewUserContent] Create failed:', error);
      toast.error('Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Set breadcrumb */}
      <BreadcrumbSetter segment="nuevo" label="Nuevo Usuario" />

      <div className="mx-auto max-w-4xl space-y-6 py-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="bg-primary/20 flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
            <UserPlus className="text-primary h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-foreground text-2xl font-bold">Nuevo Usuario</h1>
            <p className="text-muted-foreground text-sm">
              Completa los datos para crear una cuenta.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="neo-outset bg-background rounded-xl p-6">
            <h3 className="text-foreground mb-4 font-semibold">Datos Generales</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">
                  Nombre
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Juan Pérez"
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="juan@example.com"
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label htmlFor="role" className="text-sm font-medium">
                  Rol
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value as string}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && <p className="text-destructive text-sm">{errors.role.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => confirmNavigation(() => router.push('/settings/users'))}
            >
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
