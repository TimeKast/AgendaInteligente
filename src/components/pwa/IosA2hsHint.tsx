'use client';

import { useEffect, useState } from 'react';
import { X, Share } from 'lucide-react';

const IOS_HINT_KEY = 'ios-a2hs-shown';

function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isStandalone =
    'standalone' in window.navigator &&
    (window.navigator as unknown as { standalone: boolean }).standalone;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari && !isStandalone;
}

export function IosA2hsHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIosSafari()) return;
    if (localStorage.getItem(IOS_HINT_KEY)) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(IOS_HINT_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-card neo-outset-lg fixed right-4 bottom-4 left-4 z-50 rounded-lg border p-4">
      <button
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3">
        <Share className="text-primary h-5 w-5" />
        <div>
          <p className="font-medium">Instalar en iOS</p>
          <p className="text-muted-foreground text-sm">
            Toca <Share className="inline h-4 w-4" /> y luego &quot;Agregar a inicio&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
