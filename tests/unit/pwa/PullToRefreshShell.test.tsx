import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import type { ReactNode } from 'react';

const isMobileMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('@/lib/utils/platform', () => ({
  isMobile: () => isMobileMock(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

import { PullToRefreshShell } from '@/components/pwa/PullToRefreshShell';
import { ShellPTRProvider, useDisableShellPTR } from '@/lib/pwa/shellPullToRefresh';

const THRESHOLD = 80;
const RESISTANCE = 2.5;

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => value,
  });
}

function makeTouch(x: number, y: number): Touch {
  return {
    identifier: 0,
    target: window as unknown as EventTarget,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1,
  } as unknown as Touch;
}

function dispatchTouch(type: 'touchstart' | 'touchmove' | 'touchend', touches: Touch[]) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
  Object.defineProperty(event, 'touches', { value: touches, configurable: true });
  Object.defineProperty(event, 'targetTouches', { value: touches, configurable: true });
  Object.defineProperty(event, 'changedTouches', { value: touches, configurable: true });
  window.dispatchEvent(event);
}

function withProvider(ui: ReactNode) {
  return <ShellPTRProvider>{ui}</ShellPTRProvider>;
}

beforeEach(() => {
  setScrollY(0);
  isMobileMock.mockReturnValue(true);
  refreshMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PullToRefreshShell', () => {
  it('triggers router.refresh() when the user pulls past threshold and releases (mobile gate)', async () => {
    render(withProvider(<PullToRefreshShell />));

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
    });

    await act(async () => {
      dispatchTouch('touchend', []);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT mount listeners on desktop (isMobile() === false)', async () => {
    isMobileMock.mockReturnValue(false);

    render(withProvider(<PullToRefreshShell />));

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
      dispatchTouch('touchend', []);
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('does NOT trigger refresh when a child has called useDisableShellPTR()', async () => {
    function Disabler() {
      useDisableShellPTR();
      return null;
    }

    render(
      <ShellPTRProvider>
        <Disabler />
        <PullToRefreshShell />
      </ShellPTRProvider>
    );

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
      dispatchTouch('touchend', []);
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });
});
