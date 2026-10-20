/**
 * Captures the Chromium `beforeinstallprompt` event as early as possible (it
 * can fire before React mounts) and tracks `appinstalled`. Import this module
 * once from the app entry so the listeners are registered on load.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<Listener>();

/** Tells every subscriber that the captured install prompt changed. */
function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

/** The captured `beforeinstallprompt` event, or null if none is available. */
export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/** Forgets the captured event (it can only be used once) and notifies subscribers. */
export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
  notify();
}

/** True once `appinstalled` has fired in this page's lifetime. */
export function hasAppInstalled(): boolean {
  return installed;
}

/** Calls `listener` whenever the install prompt appears, is used, or the app is installed; returns an unsubscribe function. */
export function subscribeInstallPrompt(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
