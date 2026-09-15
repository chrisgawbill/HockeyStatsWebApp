import axios from 'axios';
import { get, post, put } from '@/lib/apiClient';
import type { StreakData } from '@/features/board-game/data/dailyStreak';

/**
 * The one deliberate network boundary inside `features/board-game` (see the
 * "Board game exception" note in `docs/architecture.md`): optional Google
 * sign-in used only to back up and sync the local daily streak across
 * devices. Never called automatically for an anonymous player.
 */

function authHeader(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** Exchanges a Google Identity Services credential for an app session token. */
export async function googleSignIn(
  credential: string,
): Promise<{ token: string; email: string }> {
  return post<{ token: string; email: string }>('/api/auth/google', {
    credential,
  });
}

/**
 * Resolves a stored session token to the signed-in user's email, or `null`
 * if the token is missing/expired/invalid (401) — this is the one deviation
 * from `apiClient.get`'s throw-on-error pattern, kept local to this
 * function: an expired session should fall back to signed-out silently,
 * never throw into the render tree.
 */
export async function fetchSession(token: string): Promise<{ email: string } | null> {
  try {
    return await get<{ email: string }>('/api/auth/me', undefined, authHeader(token));
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

/** Fetches the signed-in user's server-side streak backup. */
export async function fetchRemoteStreak(token: string): Promise<StreakData> {
  return get<StreakData>('/api/board-game/streak', undefined, authHeader(token));
}

/**
 * Pushes a (typically already client-merged) streak to the server, which
 * merges it with whatever it already has and returns the merged result —
 * never a blind overwrite on either side.
 */
export async function pushRemoteStreak(
  token: string,
  data: StreakData,
): Promise<StreakData> {
  return put<StreakData>('/api/board-game/streak', data, authHeader(token));
}
