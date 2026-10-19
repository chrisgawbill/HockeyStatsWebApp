import { describe, expect, it } from 'vitest';
import {
  INSTALL_KEYS,
  SNOOZE_MS,
  getInstallVariant,
  isEngagedPath,
  readInstallState,
  recordVisit,
  type InstallEnvironment,
  type InstallState,
  type KeyValueStorage,
} from '@/features/install-prompt/utils/installEligibility';

const NOW = 1_800_000_000_000;
const fresh: InstallState = {
  visits: 1,
  engaged: false,
  installed: false,
  dismissedAt: null,
};
const android: InstallEnvironment = {
  standalone: false,
  ios: false,
  hasInstallPrompt: true,
};
const ios: InstallEnvironment = {
  standalone: false,
  ios: true,
  hasInstallPrompt: false,
};

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('getInstallVariant', () => {
  it('hides on the first visit', () => {
    expect(getInstallVariant(fresh, android, NOW)).toBeNull();
  });
  it('shows from the second visit', () => {
    expect(getInstallVariant({ ...fresh, visits: 2 }, android, NOW)).toBe(
      'android',
    );
  });
  it('shows on the first visit once engaged', () => {
    expect(getInstallVariant({ ...fresh, engaged: true }, ios, NOW)).toBe(
      'ios',
    );
  });
  it('never shows when standalone', () => {
    const s = { ...fresh, visits: 5 };
    expect(
      getInstallVariant(s, { ...android, standalone: true }, NOW),
    ).toBeNull();
    expect(getInstallVariant(s, { ...ios, standalone: true }, NOW)).toBeNull();
  });
  it('never shows once installed', () => {
    expect(
      getInstallVariant({ ...fresh, visits: 5, installed: true }, android, NOW),
    ).toBeNull();
  });
  it('snoozes for 30 days after a dismissal', () => {
    const s = { ...fresh, visits: 5 };
    expect(
      getInstallVariant(
        { ...s, dismissedAt: NOW - SNOOZE_MS + 1000 },
        ios,
        NOW,
      ),
    ).toBeNull();
    expect(
      getInstallVariant({ ...s, dismissedAt: NOW - SNOOZE_MS }, ios, NOW),
    ).toBe('ios');
  });
  it('shows nothing without iOS or an install event', () => {
    expect(
      getInstallVariant(
        { ...fresh, visits: 5 },
        { standalone: false, ios: false, hasInstallPrompt: false },
        NOW,
      ),
    ).toBeNull();
  });
});

describe('isEngagedPath', () => {
  it('matches game and team detail routes only', () => {
    expect(isEngagedPath('/game/2025020001')).toBe(true);
    expect(isEngagedPath('/team/TOR')).toBe(true);
    expect(isEngagedPath('/teamList')).toBe(false);
    expect(isEngagedPath('/team')).toBe(false);
    expect(isEngagedPath('/')).toBe(false);
  });
});

describe('recordVisit / readInstallState', () => {
  it('counts once per session', () => {
    const local = memoryStorage();
    const session = memoryStorage();
    expect(recordVisit(local, session)).toBe(1);
    expect(recordVisit(local, session)).toBe(1);
    expect(recordVisit(local, memoryStorage())).toBe(2);
    expect(readInstallState(local).visits).toBe(2);
  });
  it('reads flags and the dismissal timestamp', () => {
    const local = memoryStorage();
    local.setItem(INSTALL_KEYS.installed, '1');
    local.setItem(INSTALL_KEYS.engaged, '1');
    local.setItem(INSTALL_KEYS.dismissedAt, String(NOW));
    expect(readInstallState(local)).toEqual({
      visits: 0,
      engaged: true,
      installed: true,
      dismissedAt: NOW,
    });
  });
  it('throws when storage throws so callers can hide the banner', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(() => recordVisit(broken, broken)).toThrow();
    expect(() => readInstallState(broken)).toThrow();
  });
});
