import { get, put } from '@/lib/apiClient';
import { authHeader } from '@/lib/auth/authApi';
import type { StreakData } from '@/features/board-game/data/dailyStreak';

/** Fetches the signed-in user's server-side streak backup. */
export async function fetchRemoteStreak(token: string): Promise<StreakData> {
  return get<StreakData>(
    '/api/board-game/streak',
    undefined,
    authHeader(token),
  );
}

/** Pushes the local/server-merged streak; the server merges again before saving. */
export async function pushRemoteStreak(
  token: string,
  data: StreakData,
): Promise<StreakData> {
  return put<StreakData>('/api/board-game/streak', data, authHeader(token));
}
