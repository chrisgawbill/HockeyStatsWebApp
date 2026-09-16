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
  fetchSession,
  googleSignIn,
  pushRemoteStreak,
} from '@/features/board-game/api/streakSync';
import { ApiError } from '@/lib/apiClient';

describe('streakSync', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it('googleSignIn POSTs the credential and returns the session', async () => {
    post.mockResolvedValue({ token: 'abc', email: 'chris@example.com' });

    const result = await googleSignIn('google-credential');

    expect(post).toHaveBeenCalledWith('/api/auth/google', {
      credential: 'google-credential',
    });
    expect(result).toEqual({ token: 'abc', email: 'chris@example.com' });
  });

  it('fetchSession GETs /api/auth/me with a bearer header', async () => {
    get.mockResolvedValue({ email: 'chris@example.com' });

    const result = await fetchSession('token-1');

    expect(get).toHaveBeenCalledWith('/api/auth/me', undefined, {
      headers: { Authorization: 'Bearer token-1' },
    });
    expect(result).toEqual({ email: 'chris@example.com' });
  });

  it('fetchSession returns null (does not throw) on a 401', async () => {
    const error = new ApiError(401, 'Unauthorized');
    get.mockRejectedValue(error);

    await expect(fetchSession('expired-token')).resolves.toBeNull();
  });

  it('fetchSession rethrows non-401 errors', async () => {
    const error = new ApiError(500, 'Server Error');
    get.mockRejectedValue(error);

    await expect(fetchSession('token-1')).rejects.toBe(error);
  });

  it('fetchSession rethrows non-status errors', async () => {
    const error = new Error('network down');
    get.mockRejectedValue(error);

    await expect(fetchSession('token-1')).rejects.toBe(error);
  });

  it('fetchRemoteStreak GETs the streak with a bearer header', async () => {
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
  });

  it('pushRemoteStreak PUTs the streak and returns the server-merged result', async () => {
    const local: StreakData = {
      wins: { '2026-03-10': true },
      lastWinDate: '2026-03-10',
    };
    const merged: StreakData = {
      wins: { '2026-03-09': true, '2026-03-10': true },
      lastWinDate: '2026-03-10',
    };
    put.mockResolvedValue(merged);

    const result = await pushRemoteStreak('token-1', local);

    expect(put).toHaveBeenCalledWith('/api/board-game/streak', local, {
      headers: { Authorization: 'Bearer token-1' },
    });
    expect(result).toEqual(merged);
  });
});
