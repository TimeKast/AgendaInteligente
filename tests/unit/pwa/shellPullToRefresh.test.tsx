import { describe, it, expect } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { ShellPTRProvider, useDisableShellPTR, useShellPTR } from '@/lib/pwa/shellPullToRefresh';

function wrapper({ children }: { children: ReactNode }) {
  return <ShellPTRProvider>{children}</ShellPTRProvider>;
}

describe('shellPullToRefresh context', () => {
  it('useShellPTR returns disabled=false by default (without provider)', () => {
    const { result } = renderHook(() => useShellPTR());
    expect(result.current.disabled).toBe(false);
  });

  it('useShellPTR returns disabled=false when no children call useDisableShellPTR', () => {
    const { result } = renderHook(() => useShellPTR(), { wrapper });
    expect(result.current.disabled).toBe(false);
  });

  it('useDisableShellPTR sets disabled=true while mounted, releases on unmount', () => {
    const Probe = ({ onState }: { onState: (disabled: boolean) => void }) => {
      const { disabled } = useShellPTR();
      onState(disabled);
      return null;
    };

    const Disabler = () => {
      useDisableShellPTR();
      return null;
    };

    const states: boolean[] = [];

    const { rerender } = render(
      <ShellPTRProvider>
        <Probe onState={(s) => states.push(s)} />
        <Disabler />
      </ShellPTRProvider>
    );

    // After mount with the disabler present, disabled should be true.
    expect(states.at(-1)).toBe(true);

    // Unmount the disabler — disabled should drop back to false.
    act(() => {
      rerender(
        <ShellPTRProvider>
          <Probe onState={(s) => states.push(s)} />
        </ShellPTRProvider>
      );
    });

    expect(states.at(-1)).toBe(false);
  });

  it('counter pattern: disabled stays true while ANY caller is mounted', () => {
    const Probe = ({ onState }: { onState: (disabled: boolean) => void }) => {
      const { disabled } = useShellPTR();
      onState(disabled);
      return null;
    };

    const Disabler = () => {
      useDisableShellPTR();
      return null;
    };

    const states: boolean[] = [];

    // Two simultaneous opt-outs.
    const { rerender } = render(
      <ShellPTRProvider>
        <Probe onState={(s) => states.push(s)} />
        <Disabler />
        <Disabler />
      </ShellPTRProvider>
    );
    expect(states.at(-1)).toBe(true);

    // Unmount only one — disabled must remain true (counter > 0).
    act(() => {
      rerender(
        <ShellPTRProvider>
          <Probe onState={(s) => states.push(s)} />
          <Disabler />
        </ShellPTRProvider>
      );
    });
    expect(states.at(-1)).toBe(true);

    // Unmount the second — counter hits 0, disabled drops.
    act(() => {
      rerender(
        <ShellPTRProvider>
          <Probe onState={(s) => states.push(s)} />
        </ShellPTRProvider>
      );
    });
    expect(states.at(-1)).toBe(false);
  });
});
