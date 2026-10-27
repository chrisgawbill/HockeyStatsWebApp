import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/apiClient';
import { GetGamePlayByPlay } from '@/features/game-detail/api/gameDetailApi';
import { GameDetailStatus } from '@/features/game-detail/types/gameDetail';
import { GamePlayByPlay } from '@/features/game-detail/types/playByPlay';
import { LIVE_POLL_INTERVAL_MS } from '@/features/game-detail/utils/gameDetailHelper';

/**
 * `unavailable` means the API answered 404: the route is not deployed yet or
 * the game is unknown, and the page hides the shot views entirely.
 */
export type PlayByPlayState = 'loading' | 'ready' | 'unavailable' | 'error';

/**
 * Loads a started game's shot events. While the game is live they refresh on
 * the game page's polling interval; a failed refresh keeps the last events.
 * Nothing is fetched for a game that has not started.
 */
export function usePlayByPlay(
  gameId: string | undefined,
  status: GameDetailStatus,
) {
  const [playByPlay, setPlayByPlay] = useState<GamePlayByPlay | null>(null);
  const [state, setState] = useState<PlayByPlayState>('loading');
  const [loadCount, setLoadCount] = useState(0);
  const hasStarted = status !== 'preview';

  useEffect(() => {
    if (!gameId || !hasStarted) return;
    let isCurrent = true;
    setState('loading');
    GetGamePlayByPlay(Number(gameId))
      .then((loaded) => {
        if (!isCurrent) return;
        setPlayByPlay(loaded);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        const isMissing = error instanceof ApiError && error.status === 404;
        setState(isMissing ? 'unavailable' : 'error');
      });
    return () => {
      isCurrent = false;
    };
  }, [gameId, hasStarted, loadCount]);

  useEffect(() => {
    if (!gameId || status !== 'live' || state !== 'ready') return;
    const intervalId = window.setInterval(() => {
      GetGamePlayByPlay(Number(gameId))
        .then(setPlayByPlay)
        .catch(() => {
          // Transient poll failure: keep the last events and retry on the next tick.
        });
    }, LIVE_POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [gameId, status, state]);

  const retry = useCallback(() => setLoadCount((count) => count + 1), []);

  return { playByPlay, state, retry };
}
