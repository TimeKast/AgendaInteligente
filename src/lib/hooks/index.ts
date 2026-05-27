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
// AI / Chat
// =============================================================================
export {
  useChatStream,
  type ChatMessage,
  type ChatStreamError,
  type CrisisExitState,
  type ToolResultEvent,
  type UseChatStreamResult,
} from './useChatStream';

// =============================================================================
// Add additional hooks below as needed
// =============================================================================
// export { useLocalStorage } from './useLocalStorage';
