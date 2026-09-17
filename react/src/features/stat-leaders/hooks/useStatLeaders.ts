import { useCallback, useEffect, useRef, useState } from 'react';
import { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';
import { PlayerStatLeader } from '@/features/stat-leaders/types/playerStatLeader';
import PlayerStatLeaderConverter from '@/features/stat-leaders/utils/playerStatLeaderConverter';
import {
  STAT_CONFIG,
  StatEntry,
  StatLeaderType,
} from '@/features/stat-leaders/utils/statLeaderTypes';

/**
 * Loads the stat-leader categories for one player type (skater or goalie),
 * driven by STAT_CONFIG. Returns `leaders` keyed by display name (e.g. "Goals")
 * and a single `loading` flag. Each category is fetched independently for `season`
 * and added as it resolves, so the UI can show categories as they arrive.
 * Also exposes `error` (set only when every category failed) and `retry`.
 */
export function useStatLeaders(type: StatLeaderType, season?: string) {
  const { stats, fetcher } = STAT_CONFIG[type];

  const [leaders, setLeaders] = useState<Record<string, TopStatLeader>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadingRefs = useRef<Record<string, boolean>>(
    Object.fromEntries(stats.map((s) => [s.displayKey, true])),
  );
  const failedRefs = useRef<Record<string, boolean>>(
    Object.fromEntries(stats.map((s) => [s.displayKey, false])),
  );

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
    const allFailed = stats.every((s) => failedRefs.current[s.displayKey]);
    if (allFailed) {
      setError("Couldn't load stat leaders.");
    }
  }

  /**
   * Fetches one stat category for the current season, converts the backend
   * contracts into PlayerStatLeader models, and stores the top leader keyed by
   * display label. It always clears that category's loading flag and records
   * whether the category failed.
   */
  async function fetchStat({ displayKey, apiKey }: StatEntry) {
    try {
      const data = await fetcher(apiKey, season);
      const statLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(data);
      failedRefs.current[displayKey] = false;
      if (statLeaders.length === 0) return;
      const topLeader = new TopStatLeader(
        displayKey,
        statLeaders[0],
        statLeaders,
      );
      setLeaders((prev) => ({ ...prev, [displayKey]: topLeader }));
    } catch (error) {
      console.error(`Error fetching ${displayKey}: `, error);
      failedRefs.current[displayKey] = true;
    } finally {
      loadingRefs.current[displayKey] = false;
      checkLoadingStatus();
    }
  }

  /** Runs the fetch sequence for every category. */
  const runFetch = useCallback(() => {
    setLeaders({});
    setError(null);
    setLoading(true);
    loadingRefs.current = Object.fromEntries(
      stats.map((s) => [s.displayKey, true]),
    );
    failedRefs.current = Object.fromEntries(
      stats.map((s) => [s.displayKey, false]),
    );
    Promise.all(stats.map(fetchStat)).finally(checkLoadingStatus);
  }, [stats, season]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  return { leaders, loading, error, retry: runFetch };
}
