import { useEffect, useRef, useState } from "react";
import { TopStatLeader } from "../Models/TopStatLeader";
import { PlayerStatLeader } from "../Models/PlayerStatLeader";
import PlayerStatLeaderConverter from "../Helpers/PlayerStatLeaderConverter";
import { STAT_CONFIG, StatEntry, StatLeaderType } from "../Constants/StatLeaderTypes";

export function useStatLeaders(type: StatLeaderType) {
  const { stats, fetcher } = STAT_CONFIG[type];

  const [leaders, setLeaders] = useState<Record<string, TopStatLeader>>({});
  const [loading, setLoading] = useState(true);

  const loadingRefs = useRef<Record<string, boolean>>(
    Object.fromEntries(stats.map(s => [s.displayKey, true]))
  );

  function checkLoadingStatus() {
    if (!Object.values(loadingRefs.current).includes(true)) setLoading(false);
  }

  async function fetchStat({ displayKey, apiKey }: StatEntry) {
    try {
      const data = await fetcher(apiKey);
      const statLeaders: PlayerStatLeader[] = PlayerStatLeaderConverter(data, apiKey);
      const topLeader = new TopStatLeader(displayKey, statLeaders[0], statLeaders);
      setLeaders(prev => ({ ...prev, [displayKey]: topLeader }));
    } catch (error) {
      console.error(`Error fetching ${displayKey}: `, error);
    } finally {
      loadingRefs.current[displayKey] = false;
      checkLoadingStatus();
    }
  }

  useEffect(() => {
    Promise.all(stats.map(fetchStat)).finally(checkLoadingStatus);
  }, []);

  return { leaders, loading };
}
