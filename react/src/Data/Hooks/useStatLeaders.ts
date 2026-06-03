import { useEffect, useRef, useState } from 'react';
import { TopStatLeader } from '../Models/topStatLeader';
import { PlayerStatLeader } from '../Models/playerStatLeader';
import PlayerStatLeaderConverter from '../Helpers/playerStatLeaderConverter';
import {
  STAT_CONFIG,
  StatEntry,
  StatLeaderType,
} from '../Constants/statLeaderTypes';

/**
 * Loads the stat-leader categories for one player type (skater or goalie),
 * driven by STAT_CONFIG. Returns `leaders` keyed by display name (e.g. "Goals")
 * and a single `loading` flag. Each category is fetched independently for `season`
 * and added as it resolves, so the UI can show categories as they arrive.
 */
export function useStatLeaders(type: StatLeaderType, season?: string) {
  const { stats, fetcher } = STAT_CONFIG[type];

  const [leaders, setLeaders] = useState<Record<string, TopStatLeader>>({});
  const [loading, setLoading] = useState(true);

  const loadingRefs = useRef<Record<string, boolean>>(
    Object.fromEntries(stats.map((s) => [s.displayKey, true])),
  );

  /**
   * Collapses the per-category loading map into the hook's public loading flag.
   * The map lives in a ref so category completion does not trigger extra renders
   * before all categories have settled.
   */
  function checkLoadingStatus() {
    if (!Object.values(loadingRefs.current).includes(true)) setLoading(false);
  }

  /**
   * Fetches one stat category for the current season, converts the backend
   * contracts into PlayerStatLeader models, and stores the top leader keyed by
   * display label. It always clears that category's loading flag.
   */
  async function fetchStat({ displayKey, apiKey }: StatEntry) {
    try {
      const data = await fetcher(apiKey, season);
      const statLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(data);
      if (statLeaders.length === 0) return;
      const topLeader = new TopStatLeader(
        displayKey,
        statLeaders[0],
        statLeaders,
      );
      setLeaders((prev) => ({ ...prev, [displayKey]: topLeader }));
    } catch (error) {
      console.error(`Error fetching ${displayKey}: `, error);
    } finally {
      loadingRefs.current[displayKey] = false;
      checkLoadingStatus();
    }
  }

  useEffect(() => {
    setLeaders({});
    setLoading(true);
    loadingRefs.current = Object.fromEntries(
      stats.map((s) => [s.displayKey, true]),
    );
    Promise.all(stats.map(fetchStat)).finally(checkLoadingStatus);
  }, [season]);

  return { leaders, loading };
}
