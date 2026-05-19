import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';

import { usePullToRefresh } from '@/lib/pwa/usePullToRefresh';

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

function dispatchTouch(
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  touches: Touch[]
) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
  Object.defineProperty(event, 'touches', {
    value: touches,
    configurable: true,
  });
  Object.defineProperty(event, 'targetTouches', {
    value: touches,
    configurable: true,
  });
  Object.defineProperty(event, 'changedTouches', {
    value: touches,
    configurable: true,
  });
  window.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  setScrollY(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePullToRefresh', () => {
  it('fires onRefresh when the user pulls past threshold and releases', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
      })
    );

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
    });

    expect(result.current.pullDistance).toBeGreaterThanOrEqual(THRESHOLD);

    await act(async () => {
      dispatchTouch('touchend', []);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onRefresh when pull is below threshold', async () => {
    const onRefresh = vi.fn();

    renderHook(() =>
      usePullToRefresh({
        onRefresh,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
      })
    );

    const pullPx = THRESHOLD * RESISTANCE - 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
      dispatchTouch('touchend', []);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('cancels the gesture when horizontal swipe exceeds vertical (direction lock)', async () => {
    const onRefresh = vi.fn();

    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
      })
    );

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(160, 55)]);
      dispatchTouch('touchmove', [makeTouch(200, 60)]);
      dispatchTouch('touchend', []);
    });

    expect(result.current.pullDistance).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('does NOT arm the gesture when window.scrollY > tolerance', async () => {
    const onRefresh = vi.fn();
    setScrollY(150);

    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
      })
    );

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
      dispatchTouch('touchend', []);
    });

    expect(result.current.pullDistance).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('does NOT mount listeners when enabled=false', async () => {
    const onRefresh = vi.fn();

    renderHook(() =>
      usePullToRefresh({
        onRefresh,
        enabled: false,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
      })
    );

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
      dispatchTouch('touchend', []);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('cancels on multi-touch (more than one finger)', async () => {
    const onRefresh = vi.fn();

    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
      })
    );

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50), makeTouch(200, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 250), makeTouch(200, 250)]);
      dispatchTouch('touchend', []);
    });

    expect(result.current.pullDistance).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('reads scrollTop from scrollTargetRef when provided instead of window.scrollY', async () => {
    const onRefresh = vi.fn();
    const fakeEl = document.createElement('div');
    Object.defineProperty(fakeEl, 'scrollTop', {
      configurable: true,
      get: () => 200,
    });
    setScrollY(0);

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(fakeEl);
      return usePullToRefresh({
        onRefresh,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
        scrollTargetRef: ref,
      });
    });

    const pullPx = THRESHOLD * RESISTANCE + 20;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + pullPx)]);
      dispatchTouch('touchend', []);
    });

    expect(result.current.pullDistance).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('caps pullDistance at maxPull even when the user drags far', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePullToRefresh({
        onRefresh,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
      })
    );

    const giantPull = MAX_PULL * RESISTANCE * 5;

    await act(async () => {
      dispatchTouch('touchstart', [makeTouch(100, 50)]);
      dispatchTouch('touchmove', [makeTouch(100, 50 + giantPull)]);
    });

    expect(result.current.pullDistance).toBeLessThanOrEqual(MAX_PULL);
    expect(result.current.pullDistance).toBe(MAX_PULL);
  });

  it('registers touchmove with passive: false so preventDefault can block native scroll', async () => {
    const onRefresh = vi.fn();
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() =>
      usePullToRefresh({
        onRefresh,
        threshold: THRESHOLD,
        maxPull: MAX_PULL,
        resistance: RESISTANCE,
      })
    );

    const moveCalls = addSpy.mock.calls.filter(([type]) => String(type) === 'touchmove');
    expect(moveCalls.length).toBeGreaterThan(0);
    const [, , options] = moveCalls[0];
    expect(options).toMatchObject({ passive: false });
  });
});
