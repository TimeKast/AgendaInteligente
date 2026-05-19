import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDialogViewportFit } from '@/lib/hooks/useDialogViewportFit';

type VVListener = (event: Event) => void;

interface MockVisualViewport {
  height: number;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatch: (event: string, height: number) => void;
}

function attachMockVisualViewport(initialHeight: number): MockVisualViewport {
  const listeners = new Map<string, Set<VVListener>>();
  const mock: MockVisualViewport = {
    height: initialHeight,
    addEventListener: vi.fn((event: string, cb: VVListener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: VVListener) => {
      listeners.get(event)?.delete(cb);
    }),
    dispatch: (event: string, height: number) => {
      mock.height = height;
      listeners.get(event)?.forEach((cb) => cb(new Event(event)));
    },
  };
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: mock,
  });
  return mock;
}

function TargetDiv() {
  const ref = useDialogViewportFit<HTMLDivElement>();
  return <div ref={ref} data-testid="target" />;
}

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: undefined,
  });
});

describe('useDialogViewportFit', () => {
  it('writes --dialog-vvh on the ref element using visualViewport.height', () => {
    const vv = attachMockVisualViewport(720);

    render(<TargetDiv />);
    const node = screen.getByTestId('target');

    expect(node.style.getPropertyValue('--dialog-vvh')).toBe('720px');

    vv.dispatch('resize', 480);
    expect(node.style.getPropertyValue('--dialog-vvh')).toBe('480px');

    vv.dispatch('scroll', 360);
    expect(node.style.getPropertyValue('--dialog-vvh')).toBe('360px');
  });

  it('is a no-op when visualViewport is unavailable', () => {
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    });

    render(<TargetDiv />);
    const node = screen.getByTestId('target');

    expect(node.style.getPropertyValue('--dialog-vvh')).toBe('');
  });

  it('removes listeners and clears the CSS var on unmount', () => {
    const vv = attachMockVisualViewport(640);

    const { unmount } = render(<TargetDiv />);
    const node = screen.getByTestId('target');

    expect(node.style.getPropertyValue('--dialog-vvh')).toBe('640px');

    unmount();

    expect(vv.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(vv.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(node.style.getPropertyValue('--dialog-vvh')).toBe('');
  });
});
