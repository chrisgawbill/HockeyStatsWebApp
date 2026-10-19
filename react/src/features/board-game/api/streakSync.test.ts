import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StreakData } from '@/features/board-game/data/dailyStreak';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  ApiError: class ApiError extends Error {
    constructor(public readonly status: number) {
      super();
    }
  },
  get: (...args: unknown[]) => get(...args),
  post: (...args: unknown[]) => post(...args),
  put: (...args: unknown[]) => put(...args),
}));

import {
  fetchRemoteStreak,
  pushRemoteStreak,
} from '@/features/board-game/api/streakSync';

describe('streakSync', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it('GETs and PUTs the streak with a bearer header', async () => {
    const streak: StreakData = {
      wins: { '2026-03-10': true },
      lastWinDate: '2026-03-10',
    };
    get.mockResolvedValue(streak);

    const result = await fetchRemoteStreak('token-1');

    expect(get).toHaveBeenCalledWith('/api/board-game/streak', undefined, {
      headers: { Authorization: 'Bearer token-1' },
    });
    expect(result).toEqual(streak);

    // pushRemoteStreak PUTs the streak and returns the server-merged result.
    const local: StreakData = {
      wins: { '2026-03-10': true },
      lastWinDate: '2026-03-10',
    };
    const merged: StreakData = {
      wins: { '2026-03-09': true, '2026-03-10': true },
      lastWinDate: '2026-03-10',
    };
    put.mockResolvedValue(merged);

    const pushed = await pushRemoteStreak('token-1', local);

    expect(put).toHaveBeenCalledWith('/api/board-game/streak', local, {
      headers: { Authorization: 'Bearer token-1' },
    });
    expect(pushed).toEqual(merged);
  });
});
