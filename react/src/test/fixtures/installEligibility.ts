import {
  type InstallEnvironment,
  type InstallState,
  type KeyValueStorage,
} from '@/features/install-prompt/utils/installEligibility';
export const fresh: InstallState = {
  visits: 1,
  engaged: false,
  installed: false,
  dismissedAt: null,
};
export const android: InstallEnvironment = {
  standalone: false,
  ios: false,
  hasInstallPrompt: true,
};
export const ios: InstallEnvironment = {
  standalone: false,
  ios: true,
  hasInstallPrompt: false,
};
export function memoryStorage(): KeyValueStorage & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}
