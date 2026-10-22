import { useCallback, useEffect, useState } from 'react';
import {
  fetchGoalieSeasons,
  fetchSkaterSeasons,
} from '@/features/player-compare/api/playerCompareApi';
import type {
  ComparePlayer,
  SeasonPlayerPool,
} from '@/features/player-compare/types/playerCompare';

export type SeasonPlayerPoolLoad =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'loaded'; pool: SeasonPlayerPool };

/**
 * Loads every skater's and goalie's season totals (two league-wide summary
 * calls) for searching and comparing. `retry` loads again after a failure.
 */
export function useSeasonPlayerPool(season: string): {
  load: SeasonPlayerPoolLoad;
  retry: () => void;
} {
  const [load, setLoad] = useState<SeasonPlayerPoolLoad>({
    status: 'loading',
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setLoad({ status: 'loading' });
    Promise.all([fetchSkaterSeasons(season), fetchGoalieSeasons(season)])
      .then(([skaters, goalies]) => {
        if (!isCurrent) return;
        const byId = new Map<number, ComparePlayer>();
        for (const player of [...skaters, ...goalies]) {
          byId.set(player.playerId, player);
        }
        setLoad({ status: 'loaded', pool: { skaters, goalies, byId } });
      })
      .catch(() => {
        if (isCurrent) setLoad({ status: 'failed' });
      });
    return () => {
      isCurrent = false;
    };
  }, [season, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  return { load, retry };
}
