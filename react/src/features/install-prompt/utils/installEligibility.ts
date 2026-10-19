export const INSTALL_KEYS = {
  visits: 'installPrompt.visits',
  sessionMarker: 'installPrompt.sessionCounted',
  dismissedAt: 'installPrompt.dismissedAt',
  installed: 'installPrompt.installed',
  engaged: 'installPrompt.engaged',
} as const;

export const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

export type InstallVariant = 'android' | 'ios';

export interface InstallState {
  visits: number;
  /** User has opened a game or team page in any visit. */
  engaged: boolean;
  installed: boolean;
  /** Epoch ms of the last dismissal, or null. */
  dismissedAt: number | null;
}

export interface InstallEnvironment {
  standalone: boolean;
  ios: boolean;
  /** A captured `beforeinstallprompt` event exists. */
  hasInstallPrompt: boolean;
}

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function isEngagedPath(pathname: string): boolean {
  return /^\/(game|team)\/[^/]+/.test(pathname);
}

/** Which banner variant the device could show, ignoring eligibility timing. */
export function getPlatformVariant(
  env: InstallEnvironment,
): InstallVariant | null {
  if (env.standalone) return null;
  if (env.ios) return 'ios';
  if (env.hasInstallPrompt) return 'android';
  return null;
}

export function isSnoozed(dismissedAt: number | null, now: number): boolean {
  return dismissedAt !== null && now - dismissedAt < SNOOZE_MS;
}

/** Variant to show now, or null when the banner must stay hidden. */
export function getInstallVariant(
  state: InstallState,
  env: InstallEnvironment,
  now: number,
): InstallVariant | null {
  if (state.installed) return null;
  if (isSnoozed(state.dismissedAt, now)) return null;
  if (state.visits < 2 && !state.engaged) return null;
  return getPlatformVariant(env);
}

/**
 * Counts one visit per browser session (sessionStorage marker + localStorage
 * counter). Returns the total. Throws if storage is unavailable.
 */
export function recordVisit(
  local: KeyValueStorage,
  session: KeyValueStorage,
): number {
  const current = Number(local.getItem(INSTALL_KEYS.visits)) || 0;
  if (session.getItem(INSTALL_KEYS.sessionMarker)) return current;
  const next = current + 1;
  local.setItem(INSTALL_KEYS.visits, String(next));
  session.setItem(INSTALL_KEYS.sessionMarker, '1');
  return next;
}

/** Reads persisted state. Throws if storage is unavailable. */
export function readInstallState(local: KeyValueStorage): InstallState {
  const dismissed = Number(local.getItem(INSTALL_KEYS.dismissedAt));
  return {
    visits: Number(local.getItem(INSTALL_KEYS.visits)) || 0,
    engaged: local.getItem(INSTALL_KEYS.engaged) === '1',
    installed: local.getItem(INSTALL_KEYS.installed) === '1',
    dismissedAt: dismissed > 0 ? dismissed : null,
  };
}
