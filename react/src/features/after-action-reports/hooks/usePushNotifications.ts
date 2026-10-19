import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteSubscription,
  fetchPushConfig,
  saveSubscription,
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

/**
 * Phone push for the signed-in user: reads server config, derives this
 * device's state from its real subscription, and opts in/out. When the
 * session ends, this device's subscription is removed (best effort).
 */
export function usePushNotifications(
  token: string | null,
): PushNotificationsState {
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [subscribed, setSubscribed] = useState(false);
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
    if (!token || !config?.enabled || !pushSupported()) return;
    let cancelled = false;
    getDeviceSubscription()
      .then((sub) => {
        if (!cancelled) {
          setSubscribed(sub !== null);
          setPermission(readPermission());
        }
      })
      .catch((error) => console.error('Failed to read push state:', error));
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
      const sub = await subscribeDevice(config.publicKey);
      try {
        await saveSubscription(token, sub.toJSON());
      } catch (saveError) {
        await sub.unsubscribe().catch(() => undefined);
        throw saveError;
      }
      setSubscribed(true);
    } catch (failure) {
      console.error('Failed to turn on phone notifications:', failure);
      setError("Couldn't turn on phone notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }, [token, config]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const sub = await getDeviceSubscription();
      if (sub) {
        if (token) await deleteSubscription(token, sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
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
  });

  return { status, busy, error, enable, disable };
}
