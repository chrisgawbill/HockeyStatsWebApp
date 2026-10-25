import { getApiBaseUrl } from '@/lib/apiClient';
import { getServiceWorkerContainer } from '@/lib/serviceWorker';

/** What the inbox shows for phone notifications. */
export type PushStatus =
  | 'hidden' // server push off, or this browser can't do it
  | 'ios-install' // iOS/iPadOS Safari tab: needs Add to Home Screen first
  | 'off'
  | 'on'
  | 'denied';

export interface PushEnvironment {
  /** `/api/push/config` said push is configured; false while unknown. */
  serverEnabled: boolean;
  /** serviceWorker + PushManager + Notification all exist. */
  supported: boolean;
  ios: boolean;
  standalone: boolean;
  permission: NotificationPermission | 'unsupported';
  /** This device currently has a push subscription. */
  subscribed: boolean;
  /** The account-wide notifications switch; false while unknown. */
  accountEnabled: boolean;
}

export function derivePushStatus(env: PushEnvironment): PushStatus {
  if (!env.serverEnabled) return 'hidden';
  if (env.ios && !env.standalone) return 'ios-install';
  if (!env.supported) return 'hidden';
  if (env.permission === 'denied') return 'denied';
  return env.subscribed && env.accountEnabled && env.permission === 'granted'
    ? 'on'
    : 'off';
}

/** Decodes a base64url VAPID public key for `pushManager.subscribe`. */
export function urlBase64ToUint8Array(
  base64Url: string,
): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushSupported(): boolean {
  return (
    getServiceWorkerContainer() !== null &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  );
}

export function readPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined'
    ? 'unsupported'
    : Notification.permission;
}

let registration: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Registers the push service worker (idempotent). The API origin travels in
 * the script URL so the worker can post read tokens. Failure only logs.
 */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (registration) return registration;
  const serviceWorker = getServiceWorkerContainer();
  if (!serviceWorker) return Promise.resolve(null);
  const base = import.meta.env.BASE_URL;
  registration = serviceWorker
    .register(`${base}sw.js?api=${encodeURIComponent(getApiBaseUrl())}`, {
      scope: base,
    })
    .catch((error) => {
      console.error('Service worker registration failed:', error);
      return null;
    });
  return registration;
}

/** The active registration, or null when the worker could not be registered. */
async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  const registered = await registerServiceWorker();
  const serviceWorker = getServiceWorkerContainer();
  return registered && serviceWorker ? serviceWorker.ready : null;
}

/** This device's push subscription, if any. */
export async function getDeviceSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const ready = await readyRegistration();
  return ready ? ready.pushManager.getSubscription() : null;
}

/** Subscribes this device. Caller has already been granted permission. */
export async function subscribeDevice(
  publicKey: string,
): Promise<PushSubscription> {
  const ready = await readyRegistration();
  if (!ready) throw new Error('Service worker unavailable');
  return ready.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}
