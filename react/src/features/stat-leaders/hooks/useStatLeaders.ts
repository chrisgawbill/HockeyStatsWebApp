import { useCallback, useEffect, useRef, useState } from 'react';
import { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';
import { PlayerStatLeader } from '@/features/stat-leaders/types/playerStatLeader';
import PlayerStatLeaderConverter from '@/features/stat-leaders/utils/playerStatLeaderConverter';
import {
  STAT_CONFIG,
  StatEntry,
  StatLeaderType,
} from '@/features/stat-leaders/utils/statLeaderTypes';
import { useRefreshOnStatsChange } from '@/lib/statsVersion';
import { League } from '@/features/league/utils/leagueHelper';

/**
 * Loads the stat-leader categories for one player type (skater or goalie),
 * driven by STAT_CONFIG. Returns `leaders` keyed by display name (e.g. "Goals")
 * and a single `loading` flag. Each category is fetched independently for `season`
 * (and `league`) and added as it resolves, so the UI can show categories as they arrive.
 * Also exposes `error` (set only when every category failed) and `retry`.
 * When the API's stored stats change the categories refresh in the
 * background, keeping a category's shown leaders when its refresh fails.
 */
export function useStatLeaders(
  type: StatLeaderType,
  season?: string,
  league: League = 'nhl',
) {
  const { stats, fetcher } = STAT_CONFIG[type];

  const [leaders, setLeaders] = useState<Record<string, TopStatLeader>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadingRefs = useRef<Record<string, boolean>>(
    Object.fromEntries(stats.map((stat) => [stat.displayKey, true])),
  );
  const failedRefs = useRef<Record<string, boolean>>(
    Object.fromEntries(stats.map((stat) => [stat.displayKey, false])),
  );
  const latestRun = useRef(0);

  /**
   * Collapses the per-category loading map into the hook's public loading flag.
   * The map lives in a ref so category completion does not trigger extra renders
   * before all categories have settled. Once every category has settled, decides
   * whether to surface an error: a category returning zero leaders is a normal,
   * legitimate outcome (it's simply omitted from `leaders`), so a single failed
   * category is not surfaced either — only when EVERY category in this batch
   * failed is the page told, since that pattern means the stat-leaders API
   * itself is unreachable rather than one category having no data.
   */
  function checkLoadingStatus() {
    if (Object.values(loadingRefs.current).includes(true)) return;
    setLoading(false);
    const allFailed = stats.every(
      (stat) => failedRefs.current[stat.displayKey],
    );
    if (allFailed) {
      setError(`Couldn't load ${type} leaders.`);
    }
  }

  /**
   * Fetches one stat category for the current season, converts the backend
   * contracts into PlayerStatLeader models, and stores the top leader keyed by
   * display label. It always clears that category's loading flag and records
   * whether the category failed, unless a newer run (retry or season change)
   * has started, in which case the stale result is dropped.
   */
  async function fetchStat({ displayKey, apiKey }: StatEntry, runId: number) {
    const isStale = () => runId !== latestRun.current;
    try {
      const leaderContracts = await fetcher(apiKey, season, league);
      if (isStale()) return;
      failedRefs.current[displayKey] = false;
      showLeaders(displayKey, leaderContracts);
    } catch (fetchError) {
      if (isStale()) return;
      console.error(`Error fetching ${displayKey}: `, fetchError);
      failedRefs.current[displayKey] = true;
    } finally {
      if (!isStale()) {
        loadingRefs.current[displayKey] = false;
        checkLoadingStatus();
      }
    }
  }

  /** Stores a category's top leader; a category with no leaders is left out. */
  function showLeaders(
    displayKey: string,
    leaderContracts: Awaited<ReturnType<typeof fetcher>>,
  ) {
    const statLeaders: PlayerStatLeader[] =
      PlayerStatLeaderConverter(leaderContracts);
    if (statLeaders.length === 0) return;
    const topLeader = new TopStatLeader(
      displayKey,
      statLeaders[0],
      statLeaders,
    );
    setLeaders((currentLeaders) => ({
      ...currentLeaders,
      [displayKey]: topLeader,
    }));
  }

  /**
   * Re-reads every category without clearing what is shown or the loading and
   * error state; a failed category keeps its leaders.
   */
  function refreshQuietly() {
    const runId = latestRun.current;
    for (const { displayKey, apiKey } of stats) {
      fetcher(apiKey, season, league)
        .then((leaderContracts) => {
          if (runId === latestRun.current)
            showLeaders(displayKey, leaderContracts);
        })
        .catch(() => {});
    }
  }

  /** Runs the fetch sequence for every category. */
  const runFetch = useCallback(() => {
    const runId = ++latestRun.current;
    setLeaders({});
    setError(null);
    setLoading(true);
    loadingRefs.current = Object.fromEntries(
      stats.map((stat) => [stat.displayKey, true]),
    );
    failedRefs.current = Object.fromEntries(
      stats.map((stat) => [stat.displayKey, false]),
    );
    stats.forEach((stat) => fetchStat(stat, runId));
  }, [stats, season, league]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  useRefreshOnStatsChange(refreshQuietly);

  return { leaders, loading, error, retry: runFetch };
}
