import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteSubscription,
  fetchAccountPush,
  fetchPushConfig,
  saveSubscription,
  setAccountPush,
  type PushConfig,
} from '@/features/after-action-reports/api/pushApi';
import {
  derivePushStatus,
  getDeviceSubscription,
  pushSupported,
  readPermission,
  subscribeDevice,
  type PushStatus,
} from '@/features/after-action-reports/utils/pushNotifications';
import { isIosDevice, isStandaloneDisplay } from '@/lib/displayMode';

export interface PushNotificationsState {
  status: PushStatus;
  /** An enable/disable request is in flight. */
  busy: boolean;
  /** Last enable/disable failure, cleared on the next attempt. */
  error: string | null;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

/** Whether this device can hold a push subscription without asking the user. */
function canSubscribeSilently(): boolean {
  return (
    pushSupported() &&
    readPermission() === 'granted' &&
    (!isIosDevice() || isStandaloneDisplay())
  );
}

/** Subscribes this device if needed and sends the subscription to the account. */
async function syncDeviceSubscription(
  token: string,
  publicKey: string,
): Promise<void> {
  const existing = await getDeviceSubscription();
  const subscription = existing ?? (await subscribeDevice(publicKey));
  try {
    await saveSubscription(token, subscription.toJSON());
  } catch (saveError) {
    if (!existing) await subscription.unsubscribe().catch(() => undefined);
    throw saveError;
  }
}

/**
 * Phone push for the signed-in user. Settings belong to the account: the
 * on/off control is the account-wide switch. A device whose browser already
 * allows notifications is subscribed (or re-synced) automatically on sign-in
 * and on every load, without a prompt; permission is only ever asked from
 * `enable`. When the session ends, this device's subscription is removed
 * (best effort).
 */
export function usePushNotifications(
  token: string | null,
): PushNotificationsState {
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [accountEnabled, setAccountEnabled] = useState<boolean | null>(null);
  const [permission, setPermission] = useState(readPermission);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousTokenRef = useRef<string | null>(null);

  // Config is only requested for signed-in users so visitors never wake the API.
  useEffect(() => {
    if (!token || config) return;
    let cancelled = false;
    fetchPushConfig()
      .then((next) => {
        if (!cancelled) setConfig(next);
      })
      .catch((error) => console.error('Failed to load push config:', error));
    return () => {
      cancelled = true;
    };
  }, [token, config]);

  useEffect(() => {
    if (!token || !config?.enabled) return;
    let cancelled = false;
    fetchAccountPush(token)
      .then((enabled) => {
        if (!cancelled) setAccountEnabled(enabled);
      })
      .catch((error) =>
        console.error('Failed to load notification setting:', error),
      );
    return () => {
      cancelled = true;
    };
  }, [token, config]);

  // Automatic subscription: a device that already allows notifications is
  // (re)registered to this account; one that does not keeps its state.
  useEffect(() => {
    if (!token || !config?.enabled || !pushSupported()) return;
    let cancelled = false;
    setPermission(readPermission());
    (async () => {
      if (config.publicKey && canSubscribeSilently()) {
        await syncDeviceSubscription(token, config.publicKey);
      }
      const sub = await getDeviceSubscription();
      if (!cancelled) setSubscribed(sub !== null);
    })().catch((error) =>
      console.error('Failed to sync push subscription:', error),
    );
    return () => {
      cancelled = true;
    };
  }, [token, config]);

  // Sign-out: drop this device's subscription using the session being ended.
  useEffect(() => {
    const previous = previousTokenRef.current;
    previousTokenRef.current = token;
    if (token || !previous) return;
    setSubscribed(false);
    setAccountEnabled(null);
    setError(null);
    (async () => {
      const sub = await getDeviceSubscription();
      if (!sub) return;
      try {
        await deleteSubscription(previous, sub.endpoint);
      } catch (error) {
        console.error('Failed to remove push subscription:', error);
      }
      await sub.unsubscribe();
    })().catch((error) =>
      console.error('Push sign-out cleanup failed:', error),
    );
  }, [token]);

  const enable = useCallback(async () => {
    if (!token || !config?.publicKey) return;
    setBusy(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return;
      await syncDeviceSubscription(token, config.publicKey);
      setSubscribed(true);
      setAccountEnabled(await setAccountPush(token, true));
    } catch (failure) {
      console.error('Failed to turn on phone notifications:', failure);
      setError("Couldn't turn on phone notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }, [token, config]);

  // Off is account-wide: devices stay subscribed (so turning it back on needs
  // no prompt) but nothing is sent to any of them.
  const disable = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      setAccountEnabled(await setAccountPush(token, false));
    } catch (failure) {
      console.error('Failed to turn off phone notifications:', failure);
      setError("Couldn't turn off phone notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }, [token]);

  const status = derivePushStatus({
    serverEnabled: token !== null && config?.enabled === true,
    supported: pushSupported(),
    ios: isIosDevice(),
    standalone: isStandaloneDisplay(),
    permission,
    subscribed,
    accountEnabled: accountEnabled === true,
  });

  return { status, busy, error, enable, disable };
}
