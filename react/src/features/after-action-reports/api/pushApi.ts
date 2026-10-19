import { del, get, post } from '@/lib/apiClient';
import { authHeader } from '@/lib/auth/authApi';

export interface PushConfig {
  enabled: boolean;
  publicKey: string | null;
}

/** Whether the API has Web Push configured, and its VAPID public key. */
export function fetchPushConfig(): Promise<PushConfig> {
  return get<PushConfig>('/api/push/config');
}

/** Registers this device (`PushSubscription.toJSON()`) for the signed-in user. */
export async function saveSubscription(
  token: string,
  subscription: PushSubscriptionJSON,
): Promise<void> {
  await post<unknown>(
    '/api/push/subscriptions',
    subscription,
    authHeader(token),
  );
}

export async function deleteSubscription(
  token: string,
  endpoint: string,
): Promise<void> {
  await del<unknown>('/api/push/subscriptions', authHeader(token), {
    endpoint,
  });
}
