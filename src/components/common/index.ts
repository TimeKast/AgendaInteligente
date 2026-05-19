/**
 * Common Components Exports
 *
 * Shared components used across the application.
 */

export { Footer } from './Footer';

// Viewport-aware dialog wrappers (see DRIFT-002). Prefer these over the
// `@/components/ui/dialog` and `@/components/ui/alert-dialog` primitives on
// mobile to avoid the on-screen keyboard covering the footer.
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './Dialog';
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './AlertDialog';
