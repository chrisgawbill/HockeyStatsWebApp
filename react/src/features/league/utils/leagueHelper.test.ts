import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLeagueQueryValue,
  getLeagueSwitchPath,
  parseLeague,
  readRememberedLeague,
  rememberLeague,
} from '@/features/league/utils/leagueHelper';

/** A minimal in-memory localStorage. */
function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    length: 0,
  };
}

describe('leagueHelper', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('parses only the two leagues', () => {
    expect(parseLeague('ahl')).toBe('ahl');
    expect(parseLeague('nhl')).toBe('nhl');
    for (const value of ['AHL', 'xhl', '', null]) {
      expect(parseLeague(value), String(value)).toBeNull();
    }
  });

  it('remembers the chosen league and defaults to the NHL', () => {
    vi.stubGlobal('localStorage', createStorage());
    expect(readRememberedLeague()).toBe('nhl');
    rememberLeague('ahl');
    expect(readRememberedLeague()).toBe('ahl');
  });

  it('falls back to the NHL when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => rememberLeague('ahl')).not.toThrow();
    expect(readRememberedLeague()).toBe('nhl');
  });

  it('sends a league to the API only for the AHL', () => {
    expect(getLeagueQueryValue('nhl')).toBeUndefined();
    expect(getLeagueQueryValue('ahl')).toBe('ahl');
  });

  it('stays on pages that exist in the other league and leaves the rest', () => {
    expect(getLeagueSwitchPath('/standings', 'ahl')).toBeNull();
    expect(getLeagueSwitchPath('/team/TOR', 'ahl')).toBeNull();
    expect(getLeagueSwitchPath('/team/BUF', 'ahl')).toBe('/teamList');
    expect(getLeagueSwitchPath('/team/LAV', 'nhl')).toBe('/teamList');
    expect(getLeagueSwitchPath('/game/2026020001', 'ahl')).toBe('/schedule');
    expect(getLeagueSwitchPath('/compare', 'ahl')).toBe('/');
    expect(getLeagueSwitchPath('/compare', 'nhl')).toBeNull();
  });
});
