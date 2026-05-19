/**
 * Hooks Module Exports
 *
 * Central export point for all custom React hooks.
 */

// =============================================================================
// Auth & Permissions
// =============================================================================
export { usePermissions, Can, RequireRole, type UsePermissionsReturn } from './usePermissions';
export {
  useUnsavedChangesGuard,
  type UseUnsavedChangesGuardOptions,
} from './useUnsavedChangesGuard';

// =============================================================================
// Utilities
// =============================================================================
export { useDebounce } from './useDebounce';
export { useDialogViewportFit } from './useDialogViewportFit';

// =============================================================================
// Add additional hooks below as needed
// =============================================================================
// export { useLocalStorage } from './useLocalStorage';
