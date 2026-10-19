import { useEffect, useState } from 'react';
import {
  fetchRemoteStreak,
  pushRemoteStreak,
} from '@/features/board-game/api/streakSync';
import {
  loadStreak,
  mergeStreakData,
  saveStreak,
} from '@/features/board-game/data/dailyStreak';

/**
 * Merges the local daily streak with the server backup once per session token
 * while Rink Quest is open, whether the user signed in here, elsewhere on the
 * site, or arrived with a restored session. Returns a counter that bumps after
 * each merge so the page re-reads the merged streak from localStorage.
 */
export function useStreakSignInSync(token: string | null): number {
  const [syncedCount, setSyncedCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const remote = await fetchRemoteStreak(token);
        if (cancelled) return;
        const merged = mergeStreakData(loadStreak(), remote);
        saveStreak(merged);
        setSyncedCount((count) => count + 1);
        await pushRemoteStreak(token, merged);
      } catch (error) {
        console.error('Google sign-in streak sync failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return syncedCount;
}
