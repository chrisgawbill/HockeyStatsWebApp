import { useMemo } from 'react';
import { sortByFanTier } from '@/lib/favoriteCategory';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import { useFavoritePlayers } from '@/features/favorite-players/hooks/FavoritePlayersContext';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';
import type { FeedTeam } from '@/features/my-hockey/types/myHockey';

export interface FeedFavorites {
  isSignedIn: boolean;
  /** NHL favorite teams, Diehard first. */
  teams: FeedTeam[];
  /** NHL favorite players, Diehard first; empty when the API predates them. */
  players: FavoritePlayer[];
}

/**
 * The signed-in user's NHL favorite teams and players in tier order, for the
 * games feed and Up next, which read NHL schedules and stats only (an AHL
 * `TOR` must never pull Maple Leafs games).
 * shortcut: AHL favorites have no games or season lines in the feed; add AHL
 * schedules to useMyHockeyData if users ask for them.
 */
export function useFeedFavorites(): FeedFavorites {
  const { isSignedIn, favorites: favoriteTeams } = useAfterActionReports();
  const { available, favorites: favoritePlayers } = useFavoritePlayers();
  const teams = useMemo(
    () =>
      sortByFanTier(favoriteTeams.filter((team) => team.league === 'nhl')).map(
        ({ triCode, tier, label }) => ({ triCode, tier, label }),
      ),
    [favoriteTeams],
  );
  const players = useMemo(
    () =>
      available
        ? sortByFanTier(
            favoritePlayers.filter((player) => player.league === 'nhl'),
          )
        : [],
    [available, favoritePlayers],
  );
  return { isSignedIn, teams, players };
}
