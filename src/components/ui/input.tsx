import * as React from 'react';

import { cn } from '@/lib/utils/cn';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-background text-foreground neo-inset-sm h-9 w-full min-w-0 rounded-xl border-0 px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:italic disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:[box-shadow:var(--neo-inset)]',
        'aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]',
        className
      )}
      {...props}
    />
  );
}

export { Input };
