import axios from 'axios';
import { get, post, put } from '@/lib/apiClient';
import type { StreakData } from '@/features/board-game/data/dailyStreak';

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
 * for an expired/invalid session.
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

/** Pushes the local/server-merged streak; the server merges again before saving. */
export async function pushRemoteStreak(
  token: string,
  data: StreakData,
): Promise<StreakData> {
  return put<StreakData>('/api/board-game/streak', data, authHeader(token));
}
