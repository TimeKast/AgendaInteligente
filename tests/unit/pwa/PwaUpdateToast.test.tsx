import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

let currentPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

import { PwaUpdateToast } from '@/components/pwa/PwaUpdateToast';

interface FakeRegistration {
  waiting: ServiceWorker | null;
  installing: ServiceWorker | null;
  update: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
}

function setupServiceWorkerMock(opts?: {
  hasController?: boolean;
  registration?: Partial<FakeRegistration> | null;
}) {
  const hasController = opts?.hasController ?? true;
  const registration: FakeRegistration | null =
    opts?.registration === null
      ? null
      : ({
          waiting: null,
          installing: null,
          update: vi.fn().mockResolvedValue(undefined),
          addEventListener: vi.fn(),
          ...(opts?.registration ?? {}),
        } as FakeRegistration);

  const swMock = {
    controller: hasController ? ({} as ServiceWorker) : null,
    getRegistration: vi.fn().mockResolvedValue(registration),
    addEventListener: vi.fn(),
  };

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: swMock,
  });

  return { swMock, registration };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  currentPathname = '/dashboard';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PwaUpdateToast — SW update aggressiveness', () => {
  it('calls registration.update() on mount when controller exists', async () => {
    const { registration } = setupServiceWorkerMock();

    render(<PwaUpdateToast />);
    await flush();

    expect(registration?.update).toHaveBeenCalledTimes(1);
  });

  it('does NOT call update() when there is no active controller (first install)', async () => {
    const { registration } = setupServiceWorkerMock({ hasController: false });

    render(<PwaUpdateToast />);
    await flush();

    expect(registration?.update).not.toHaveBeenCalled();
  });

  it('calls update() again when pathname changes', async () => {
    const { registration } = setupServiceWorkerMock();

    const { rerender } = render(<PwaUpdateToast />);
    await flush();
    expect(registration?.update).toHaveBeenCalledTimes(1);

    currentPathname = '/settings';
    rerender(<PwaUpdateToast />);
    await flush();

    expect(registration?.update).toHaveBeenCalledTimes(2);
  });

  it('calls update() when visibilitychange fires with state=visible', async () => {
    const { registration } = setupServiceWorkerMock();

    render(<PwaUpdateToast />);
    await flush();
    expect(registration?.update).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    expect(registration?.update).toHaveBeenCalledTimes(2);
  });

  it('does NOT call update() when visibilitychange fires with state=hidden', async () => {
    const { registration } = setupServiceWorkerMock();

    render(<PwaUpdateToast />);
    await flush();
    expect(registration?.update).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    expect(registration?.update).toHaveBeenCalledTimes(1);
  });

  it('calls update() when window receives focus', async () => {
    const { registration } = setupServiceWorkerMock();

    render(<PwaUpdateToast />);
    await flush();
    expect(registration?.update).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();
    });

    expect(registration?.update).toHaveBeenCalledTimes(2);
  });

  it('removes lifecycle listeners on unmount', async () => {
    const { registration } = setupServiceWorkerMock();

    const { unmount } = render(<PwaUpdateToast />);
    await flush();
    const initialCalls = registration?.update.mock.calls.length ?? 0;

    unmount();

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();
    });

    expect(registration?.update).toHaveBeenCalledTimes(initialCalls);
  });
});
