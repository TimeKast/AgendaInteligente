'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false; // Assume online during SSR
}

export function OfflineBanner() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <div className="bg-warning text-warning-foreground fixed top-0 right-0 left-0 z-50 px-4 py-2 text-center text-sm">
      <WifiOff className="mr-2 inline h-4 w-4" />
      Estás sin conexión. Algunas funciones pueden no estar disponibles.
    </div>
  );
}
