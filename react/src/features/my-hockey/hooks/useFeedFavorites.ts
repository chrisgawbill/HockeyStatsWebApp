import { useMemo } from 'react';
import { sortByFanTier } from '@/lib/favoriteCategory';
import { useAfterActionReports } from '@/features/after-action-reports/hooks/AfterActionReportsContext';
import { useFavoritePlayers } from '@/features/favorite-players/hooks/FavoritePlayersContext';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';
import type { FeedTeam } from '@/features/my-hockey/types/myHockey';

export interface FeedFavorites {
  isSignedIn: boolean;
  /** Favorite teams, Diehard first. */
  teams: FeedTeam[];
  /** Favorite players, Diehard first; empty when the API predates them. */
  players: FavoritePlayer[];
}

/** The signed-in user's favorite teams and players in tier order. */
export function useFeedFavorites(): FeedFavorites {
  const { isSignedIn, favorites: favoriteTeams } = useAfterActionReports();
  const { available, favorites: favoritePlayers } = useFavoritePlayers();
  const teams = useMemo(
    () =>
      sortByFanTier(favoriteTeams).map(({ triCode, tier, label }) => ({
        triCode,
        tier,
        label,
      })),
    [favoriteTeams],
  );
  const players = useMemo(
    () => (available ? sortByFanTier(favoritePlayers) : []),
    [available, favoritePlayers],
  );
  return { isSignedIn, teams, players };
}
