'use client';

/**
 * UserDataTab Component
 *
 * Inline edit form for the "Datos" tab in user detail page.
 * Pre-populated with current user data. On save stays on same page.
 * On cancel resets form to original values (no navigation).
 *
 * @see UXUI-009
 * @see crud-scaffold.md Layer 10
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUser } from '@/lib/actions/admin/user-admin';
import { getAssignableRoles, getRoleDisplayName, type Role } from '@/config/roles';
import { toast } from 'sonner';
import { updateUserSchema } from '@/lib/validations/admin/user-admin';
import { useUnsavedChangesGuard } from '@/lib/hooks/useUnsavedChangesGuard';

// =============================================================================
// Types
// =============================================================================

type EditFormData = z.infer<typeof updateUserSchema>;

interface UserDataTabProps {
  user: {
    id: string;
    humanId: string;
    name: string | null;
    email: string;
    role: string;
  };
  currentUserRole: string;
  /** Disable all fields (e.g. soft-deleted user) */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function UserDataTab({ user, currentUserRole, disabled = false }: UserDataTabProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get assignable roles
  const assignableRoles = getAssignableRoles(currentUserRole);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
      role: user.role as Role,
    },
  });
  const { confirmNavigation, allowNavigation } = useUnsavedChangesGuard({
    isDirty,
    disabled: disabled || isSubmitting,
  });

  // Handle submit — stays on same page
  async function onSubmit(data: EditFormData) {
    setIsSubmitting(true);

    try {
      const result = await updateUser(user.id, data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Usuario actualizado correctamente');
        reset(data);
        allowNavigation(() => router.refresh());
      }
    } catch (error) {
      console.error('[UserDataTab] Save failed:', error);
      toast.error('Error al guardar usuario');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
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
                disabled={disabled || isSubmitting}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            {/* Email (read-only in edit mode) */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="juan@example.com"
                disabled
                className="cursor-not-allowed opacity-60"
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
                    disabled={disabled || isSubmitting}
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

            {/* Human ID (read-only) */}
            <div className="space-y-1.5">
              <label htmlFor="humanId" className="text-sm font-medium">
                ID
              </label>
              <Input
                id="humanId"
                value={user.humanId}
                readOnly
                disabled
                className="cursor-not-allowed opacity-60"
              />
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
            disabled={disabled || isSubmitting}
          >
            Cancelar
          </Button>
          {!disabled && (
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
