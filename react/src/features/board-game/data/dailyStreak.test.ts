import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  currentStreak,
  hasStreakBonus,
  loadStreak,
  mergeStreakData,
  recordWin,
  saveStreak,
  todayKey,
  type StreakData,
} from '@/features/board-game/data/dailyStreak';

function setDate(year: number, month: number, day: number) {
  vi.setSystemTime(new Date(year, month - 1, day, 12));
}

function makeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size;
    },
  } satisfies Storage;
}

describe('dailyStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setDate(2026, 3, 10);
    vi.stubGlobal('localStorage', makeStorage());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('formats today as a local YYYY-MM-DD key', () => {
    setDate(2026, 11, 4);

    expect(todayKey()).toBe('2026-11-04');
  });

  it('loads a stored streak record', () => {
    const stored: StreakData = {
      wins: { '2026-03-09': true },
      lastWinDate: '2026-03-09',
    };
    vi.stubGlobal(
      'localStorage',
      makeStorage({ 'rinkquest-streak': JSON.stringify(stored) }),
    );

    expect(loadStreak()).toEqual(stored);
  });

  it('returns the default when storage is empty, malformed, or unavailable', () => {
    expect(loadStreak()).toEqual({ wins: {}, lastWinDate: null });

    vi.stubGlobal(
      'localStorage',
      makeStorage({ 'rinkquest-streak': '{not-json' }),
    );
    expect(loadStreak()).toEqual({ wins: {}, lastWinDate: null });

    vi.stubGlobal('localStorage', {
      ...makeStorage(),
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
    });
    expect(loadStreak()).toEqual({ wins: {}, lastWinDate: null });
  });

  it('counts a 3-day streak ending today', () => {
    const data: StreakData = {
      wins: {
        '2026-03-08': true,
        '2026-03-09': true,
        '2026-03-10': true,
      },
      lastWinDate: '2026-03-10',
    };

    expect(currentStreak(data)).toBe(3);
    expect(hasStreakBonus(data)).toBe(true);
  });

  it('counts a streak ending yesterday before today has been won', () => {
    const data: StreakData = {
      wins: {
        '2026-03-07': true,
        '2026-03-08': true,
        '2026-03-09': true,
      },
      lastWinDate: '2026-03-09',
    };

    expect(currentStreak(data)).toBe(3);
    expect(hasStreakBonus(data)).toBe(true);
  });

  it('resets to zero when today and yesterday are missing', () => {
    const data: StreakData = {
      wins: {
        '2026-03-06': true,
        '2026-03-08': true,
      },
      lastWinDate: '2026-03-08',
    };

    expect(currentStreak(data)).toBe(0);
    expect(hasStreakBonus(data)).toBe(false);
  });

  it('records a win once per day and persists the updated data', () => {
    const storage = makeStorage();
    vi.stubGlobal('localStorage', storage);

    const first = recordWin({ wins: {}, lastWinDate: null });
    const second = recordWin(first);

    expect(first).toEqual({
      wins: { '2026-03-10': true },
      lastWinDate: '2026-03-10',
    });
    expect(second).toEqual(first);
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    expect(JSON.parse(storage.setItem.mock.calls[1][1])).toEqual(first);
  });

  it('garbage-collects wins older than 60 days on write', () => {
    const updated = recordWin({
      wins: {
        '2026-01-08': true,
        '2026-01-09': true,
        '2026-01-10': true,
        '2026-03-09': true,
      },
      lastWinDate: '2026-03-09',
    });

    expect(updated).toEqual({
      wins: {
        '2026-01-09': true,
        '2026-01-10': true,
        '2026-03-09': true,
        '2026-03-10': true,
      },
      lastWinDate: '2026-03-10',
    });
  });

  it('returns the updated streak even if storage rejects the write', () => {
    vi.stubGlobal('localStorage', {
      ...makeStorage(),
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
    });

    expect(recordWin({ wins: {}, lastWinDate: null })).toEqual({
      wins: { '2026-03-10': true },
      lastWinDate: '2026-03-10',
    });
  });

  it('saveStreak round-trips through loadStreak without win-recording side effects', () => {
    const storage = makeStorage();
    vi.stubGlobal('localStorage', storage);

    const data: StreakData = {
      wins: { '2026-01-01': true, '2026-03-05': true },
      lastWinDate: '2026-03-05',
    };

    saveStreak(data);

    expect(loadStreak()).toEqual(data);
    // No garbage collection or "today" injection like recordWin performs.
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('saveStreak silently tolerates storage errors', () => {
    vi.stubGlobal('localStorage', {
      ...makeStorage(),
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
    });

    expect(() => saveStreak({ wins: {}, lastWinDate: null })).not.toThrow();
  });

  describe('mergeStreakData', () => {
    it('unions disjoint wins keys', () => {
      const local: StreakData = { wins: { '2026-03-08': true }, lastWinDate: '2026-03-08' };
      const remote: StreakData = { wins: { '2026-03-09': true }, lastWinDate: '2026-03-09' };

      expect(mergeStreakData(local, remote)).toEqual({
        wins: { '2026-03-08': true, '2026-03-09': true },
        lastWinDate: '2026-03-09',
      });
    });

    it('does not duplicate overlapping keys', () => {
      const local: StreakData = {
        wins: { '2026-03-08': true, '2026-03-09': true },
        lastWinDate: '2026-03-09',
      };
      const remote: StreakData = {
        wins: { '2026-03-09': true, '2026-03-10': true },
        lastWinDate: '2026-03-10',
      };

      expect(mergeStreakData(local, remote)).toEqual({
        wins: { '2026-03-08': true, '2026-03-09': true, '2026-03-10': true },
        lastWinDate: '2026-03-10',
      });
    });

    it('picks the lexicographically later lastWinDate regardless of side', () => {
      const earlierLocal: StreakData = { wins: {}, lastWinDate: '2026-03-05' };
      const laterRemote: StreakData = { wins: {}, lastWinDate: '2026-03-09' };
      expect(mergeStreakData(earlierLocal, laterRemote).lastWinDate).toBe('2026-03-09');

      const laterLocal: StreakData = { wins: {}, lastWinDate: '2026-03-09' };
      const earlierRemote: StreakData = { wins: {}, lastWinDate: '2026-03-05' };
      expect(mergeStreakData(laterLocal, earlierRemote).lastWinDate).toBe('2026-03-09');
    });

    it('falls back to whichever side is non-null when one lastWinDate is null', () => {
      expect(
        mergeStreakData(
          { wins: {}, lastWinDate: null },
          { wins: {}, lastWinDate: '2026-03-09' },
        ).lastWinDate,
      ).toBe('2026-03-09');

      expect(
        mergeStreakData(
          { wins: {}, lastWinDate: '2026-03-09' },
          { wins: {}, lastWinDate: null },
        ).lastWinDate,
      ).toBe('2026-03-09');
    });

    it('returns null when both sides are null', () => {
      expect(
        mergeStreakData({ wins: {}, lastWinDate: null }, { wins: {}, lastWinDate: null })
          .lastWinDate,
      ).toBeNull();
    });
  });
});
