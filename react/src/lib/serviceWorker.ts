/**
 * The page's service worker container, or null where service workers are off.
 * Checking `'serviceWorker' in navigator` is not enough: Firefox private
 * windows keep the property but set it to undefined.
 */
export function getServiceWorkerContainer(): ServiceWorkerContainer | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.serviceWorker ?? null;
}
