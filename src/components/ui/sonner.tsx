'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Detect coarse pointer (touch input) instead of viewport width:
// width-based detection misses iPhone landscape (~844px), iPad
// portrait/landscape, and 2-in-1 tablets in tablet mode. The pointer
// media query reflects what actually matters for toast UX — whether the
// user interacts via touch or mouse — and updates live when a Surface
// docks/undocks its keyboard.
const COARSE_POINTER_QUERY = '(pointer: coarse)';

const subscribeCoarsePointer = (callback: () => void) => {
  const mq = window.matchMedia(COARSE_POINTER_QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
};

const getCoarseSnapshot = () => window.matchMedia(COARSE_POINTER_QUERY).matches;
const getCoarseServerSnapshot = () => false;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const isCoarsePointer = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarseSnapshot,
    getCoarseServerSnapshot
  );

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position={isCoarsePointer ? 'top-center' : 'bottom-right'}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:!bg-primary group-[.toaster]:!text-primary-foreground group-[.toaster]:!border-transparent group-[.toaster]:!shadow-(--neo-float)',
          description: 'group-[.toast]:!text-primary-foreground/90',
          actionButton:
            'group-[.toast]:!bg-primary-foreground group-[.toast]:!text-primary group-[.toast]:!font-semibold',
          cancelButton:
            'group-[.toast]:!bg-transparent group-[.toast]:!text-primary-foreground hover:group-[.toast]:!bg-primary-foreground/10',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
