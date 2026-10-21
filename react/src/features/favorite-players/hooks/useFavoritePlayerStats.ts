import { useEffect, useState } from 'react';
import {
  GetGoalieSummary,
  GetSkaterSummary,
} from '@/features/teams/api/teamsApi';
import {
  transformGoalieStats,
  transformPlayerStats,
} from '@/features/teams/utils/teamPageHelper';
import {
  buildPlayerStatCells,
  buildStatsLookup,
  type StatCell,
} from '@/features/teams/utils/playerStatsHelper';
import type { TokenSlot } from '@/features/teams/utils/teamLinesHelper';
import { localTeamList } from '@/lib/teamListData';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';

export type FavoritePlayerStatsLoad =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'loaded'; statCells: StatCell[] | null };

/** Returns the stat layout for an NHL position code: goalie or skater. */
function getStatSlot(position: string | null): TokenSlot {
  if (position === 'G') return 'G';
  return position === 'D' ? 'D' : 'F';
}

/**
 * Fetches the season totals of the player's team and returns the player's
 * stat cells, or null when the team has no stat line for them (for example
 * after a trade).
 */
async function loadStatCells(
  player: FavoritePlayer,
  teamId: number,
  season: string,
): Promise<StatCell[] | null> {
  const slot = getStatSlot(player.position);
  const lookup =
    slot === 'G'
      ? buildStatsLookup(
          [],
          transformGoalieStats(await GetGoalieSummary(String(teamId), season)),
        )
      : buildStatsLookup(
          transformPlayerStats(
            await GetSkaterSummary(String(teamId), season),
            null,
          ),
          [],
        );
  return buildPlayerStatCells(player.playerId, slot, lookup);
}

/** Loads a favorite player's season stats for the stats dialog. */
export function useFavoritePlayerStats(
  player: FavoritePlayer,
  season: string,
): FavoritePlayerStatsLoad {
  const [statsLoad, setStatsLoad] = useState<FavoritePlayerStatsLoad>({
    status: 'loading',
  });

  useEffect(() => {
    const teamId = localTeamList.find(
      (team) => team.triCode === player.teamTriCode,
    )?.id;
    if (!teamId) {
      setStatsLoad({ status: 'loaded', statCells: null });
      return;
    }
    let isCurrentRequest = true;
    setStatsLoad({ status: 'loading' });
    loadStatCells(player, teamId, season)
      .then((statCells) => {
        if (isCurrentRequest) setStatsLoad({ status: 'loaded', statCells });
      })
      .catch((error) => {
        console.error('Failed to load favorite player stats:', error);
        if (isCurrentRequest) setStatsLoad({ status: 'failed' });
      });
    return () => {
      isCurrentRequest = false;
    };
    // Keyed on the fields that pick the stats, not the player object, so a
    // tier change (which replaces the object) does not refetch.
  }, [player.playerId, player.teamTriCode, player.position, season]);

  return statsLoad;
}
