'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    logger.error('Application error', { error: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        {/* Icon */}
        <div className="bg-error/20 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <AlertTriangle className="text-error h-10 w-10" />
        </div>

        {/* Title */}
        <h1 className="text-foreground mb-2 text-2xl font-semibold">Algo salió mal</h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 max-w-md">
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
        </p>

        {/* Error digest (dev only) */}
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-muted-foreground mb-4 font-mono text-xs">Error ID: {error.digest}</p>
        )}

        {/* Action */}
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground neo-outset-sm inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all hover:shadow-md active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.1)]"
        >
          <RefreshCw className="h-5 w-5" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
