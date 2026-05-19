'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NavigationControls() {
  const router = useRouter();

  return (
    <div className="mr-2 flex items-center gap-0">
      <button
        onClick={() => router.back()}
        className="text-muted-foreground hover:neo-inset-sm hover:text-foreground rounded-md p-1 transition-all"
        aria-label="Atrás"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => router.forward()}
        className="text-muted-foreground hover:neo-inset-sm hover:text-foreground rounded-md p-1 transition-all"
        aria-label="Adelante"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
