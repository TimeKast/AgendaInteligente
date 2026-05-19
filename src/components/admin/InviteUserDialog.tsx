'use client';

/**
 * InviteUserDialog Component
 *
 * Dialog for inviting users via email with role selection.
 * Uses the existing /api/invites/send endpoint.
 * Role options are determined by the current user's assignableRoles from ROLE_CONFIG.
 *
 * @see RBAC-002
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getAssignableRoles, getRoleDisplayName, getDefaultRole, type Role } from '@/config/roles';

// =============================================================================
// Types
// =============================================================================

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current user's role — determines which roles can be assigned */
  currentUserRole: string;
}

// =============================================================================
// Form Schema
// =============================================================================

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.string().min(1, 'Selecciona un rol'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

// =============================================================================
// Component
// =============================================================================

export function InviteUserDialog({ open, onOpenChange, currentUserRole }: InviteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignableRoles = getAssignableRoles(currentUserRole);
  const defaultAssignedRole: Role =
    assignableRoles.length > 0
      ? assignableRoles[assignableRoles.length - 1] // lowest privilege
      : getDefaultRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: defaultAssignedRole,
    },
  });

  async function onSubmit(data: InviteFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, role: data.role }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || 'Error al enviar invitación');
        return;
      }

      toast.success(result.message || `Invitación enviada a ${data.email}`);
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('[InviteUserDialog] Send failed:', error);
      toast.error('Error al enviar invitación');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>
            Envía una invitación por email. El usuario podrá registrarse con su propia contraseña.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="invite-email"
              type="email"
              {...register('email')}
              placeholder="usuario@example.com"
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>

          {/* Role selector */}
          {assignableRoles.length > 1 && (
            <div className="space-y-1.5">
              <label htmlFor="invite-role" className="text-sm font-medium">
                Rol
              </label>
              <select
                id="invite-role"
                {...register('role')}
                disabled={isSubmitting}
                className="bg-background text-foreground placeholder:text-muted-foreground neo-inset-sm focus-visible:ring-ring/50 flex h-9 w-full rounded-xl border-0 px-3 py-1 text-sm transition-all placeholder:italic focus-visible:ring-[3px] focus-visible:[box-shadow:var(--neo-inset)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {getRoleDisplayName(r)}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-destructive text-sm">{errors.role.message}</p>}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar invitación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
