import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchGoalieSeasons,
  fetchSkaterSeasons,
} from '@/features/player-compare/api/playerCompareApi';
import type {
  ComparePlayer,
  SeasonPlayerPool,
} from '@/features/player-compare/types/playerCompare';
import { useRefreshOnStatsChange } from '@/lib/statsVersion';

export type SeasonPlayerPoolLoad =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'loaded'; pool: SeasonPlayerPool };

/** Fetches every skater's and goalie's season totals, indexed by player id. */
async function fetchSeasonPlayerPool(
  season: string,
): Promise<SeasonPlayerPool> {
  const [skaters, goalies] = await Promise.all([
    fetchSkaterSeasons(season),
    fetchGoalieSeasons(season),
  ]);
  const byId = new Map<number, ComparePlayer>();
  for (const player of [...skaters, ...goalies]) {
    byId.set(player.playerId, player);
  }
  return { skaters, goalies, byId };
}

/**
 * Loads every skater's and goalie's season totals (two league-wide summary
 * calls) for searching and comparing. `retry` loads again after a failure.
 * When the API's stored stats change the totals refresh in the background,
 * keeping the shown pool when a refresh fails.
 */
export function useSeasonPlayerPool(season: string): {
  load: SeasonPlayerPoolLoad;
  retry: () => void;
} {
  const [load, setLoad] = useState<SeasonPlayerPoolLoad>({
    status: 'loading',
  });
  const [attempt, setAttempt] = useState(0);
  const seasonRef = useRef(season);
  seasonRef.current = season;

  useEffect(() => {
    let isCurrent = true;
    setLoad({ status: 'loading' });
    fetchSeasonPlayerPool(season)
      .then((pool) => {
        if (isCurrent) setLoad({ status: 'loaded', pool });
      })
      .catch(() => {
        if (isCurrent) setLoad({ status: 'failed' });
      });
    return () => {
      isCurrent = false;
    };
  }, [season, attempt]);

  useRefreshOnStatsChange(() => {
    const refreshedSeason = season;
    fetchSeasonPlayerPool(refreshedSeason)
      .then((pool) => {
        if (seasonRef.current === refreshedSeason)
          setLoad({ status: 'loaded', pool });
      })
      .catch(() => {});
  });

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  return { load, retry };
}
