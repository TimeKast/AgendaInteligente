/**
 * Service Worker Listener — SW_NAVIGATE handler + debug logging.
 *
 * Handles two concerns:
 * 1. SW_NAVIGATE messages from the SW's notificationclick handler.
 *    The SW sends { type: 'SW_NAVIGATE', url } instead of calling
 *    client.navigate() directly — this keeps the SW out of the
 *    navigation path and prevents state corruption.
 *
 * 2. controllerchange logging for debug purposes.
 *
 * Mount once in Providers.tsx via useEffect.
 */
export function registerSwListener() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Handle navigation requests from the SW (push notification clicks)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_NAVIGATE') {
      const url = event.data.url as string;
      console.log('[sw-listener] SW_NAVIGATE received, navigating to:', url);
      // Use window.location for a clean full navigation
      window.location.href = url;
    }
  });

  // Debug logging for controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[sw-listener] Service Worker controller changed.');
  });
}
