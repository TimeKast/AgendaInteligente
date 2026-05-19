'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        {/* 404 Number */}
        <h1 className="text-primary mb-4 text-9xl font-bold">404</h1>

        {/* Title */}
        <h2 className="text-foreground mb-2 text-2xl font-semibold">Página no encontrada</h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 max-w-md">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Action */}
        <Link
          href="/dashboard"
          className="bg-primary text-primary-foreground neo-outset-sm inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all hover:shadow-md active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.1)]"
        >
          <Home className="h-5 w-5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
