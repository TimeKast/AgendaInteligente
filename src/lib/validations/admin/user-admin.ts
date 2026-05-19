/**
 * User Admin Validations
 *
 * Zod schemas for admin user management operations.
 */

import { z } from 'zod';
import { ROLES } from '@/config/roles';

// =============================================================================
// Create User Schema
// =============================================================================

export const createUserSchema = z.object({
  /** User's display name */
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  /** User's email address */
  email: z.string().email('Email inválido'),

  /** User's role */
  role: z.enum([ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN], {
    message: 'Rol inválido',
  }),

  /** Password (optional for OAuth users) */
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .optional()
    .or(z.literal('')),
});

// =============================================================================
// Update User Schema
// =============================================================================

export const updateUserSchema = z.object({
  /** User's display name */
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  /** User's email address */
  email: z.string().email('Email inválido'),

  /** User's role */
  role: z.enum([ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN], {
    message: 'Rol inválido',
  }),
});
