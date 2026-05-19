'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type ShellPTRCtx = {
  disableCount: number;
  acquire: () => void;
  release: () => void;
};

const ShellPTRContext = createContext<ShellPTRCtx>({
  disableCount: 0,
  acquire: () => {},
  release: () => {},
});

export function ShellPTRProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const acquire = useCallback(() => setCount((c) => c + 1), []);
  const release = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);
  return (
    <ShellPTRContext.Provider value={{ disableCount: count, acquire, release }}>
      {children}
    </ShellPTRContext.Provider>
  );
}

export function useShellPTR() {
  const { disableCount } = useContext(ShellPTRContext);
  return { disabled: disableCount > 0 };
}

/** Call from a client component to opt-out of shell PTR while mounted. */
export function useDisableShellPTR() {
  const { acquire, release } = useContext(ShellPTRContext);
  useEffect(() => {
    acquire();
    return release;
  }, [acquire, release]);
}
