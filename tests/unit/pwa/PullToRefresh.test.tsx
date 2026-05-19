import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const isMobileMock = vi.fn();

vi.mock('@/lib/utils/platform', () => ({
  isMobile: () => isMobileMock(),
}));

import { PullToRefresh } from '@/components/pwa/PullToRefresh';

const THRESHOLD = 80;
const MAX_PULL = 120;
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

beforeEach(() => {
  setScrollY(0);
  isMobileMock.mockReturnValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PullToRefresh (per-screen wrapper)', () => {
  it('renders children inside the wrapper', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div data-testid="content">Hello</div>
      </PullToRefresh>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('invokes onRefresh when the user pulls past threshold and releases (mobile gate)', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh
        onRefresh={onRefresh}
        threshold={THRESHOLD}
        maxPull={MAX_PULL}
        resistance={RESISTANCE}
      >
        <div>content</div>
      </PullToRefresh>
    );

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

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('does NOT invoke onRefresh on desktop (isMobile() === false)', async () => {
    isMobileMock.mockReturnValue(false);

    const onRefresh = vi.fn();

    render(
      <PullToRefresh
        onRefresh={onRefresh}
        threshold={THRESHOLD}
        maxPull={MAX_PULL}
        resistance={RESISTANCE}
      >
        <div>content</div>
      </PullToRefresh>
    );

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
      dispatchTouch('touchend', []);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('respects explicit `enabled=false` even when isMobile() returns true', async () => {
    const onRefresh = vi.fn();

    render(
      <PullToRefresh
        onRefresh={onRefresh}
        enabled={false}
        threshold={THRESHOLD}
        maxPull={MAX_PULL}
        resistance={RESISTANCE}
      >
        <div>content</div>
      </PullToRefresh>
    );

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
      dispatchTouch('touchend', []);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('respects explicit `enabled=true` even when isMobile() returns false (override)', async () => {
    isMobileMock.mockReturnValue(false);

    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh
        onRefresh={onRefresh}
        enabled={true}
        threshold={THRESHOLD}
        maxPull={MAX_PULL}
        resistance={RESISTANCE}
      >
        <div>content</div>
      </PullToRefresh>
    );

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

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('keeps the wrapper subtree class `overscroll-y-contain` so browser bounce is contained locally', () => {
    const { container } = render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>content</div>
      </PullToRefresh>
    );

    const wrapper = container.firstElementChild as HTMLElement | null;
    expect(wrapper?.className).toMatch(/overscroll-y-contain/);
  });
});
