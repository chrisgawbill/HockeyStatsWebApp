import { del, get, patch, post, put } from '@/lib/apiClient';
import { authHeader } from '@/lib/auth/authApi';
import {
  readCategoryLabel,
  readFanTier,
  type FavoriteCategory,
} from '@/lib/favoriteCategory';
import type {
  AfterActionReportInbox,
  FavoriteTeam,
} from '@/features/after-action-reports/types/afterActionReport';
import {
  withLeagueQuery,
  type League,
} from '@/features/league/utils/leagueHelper';

type FavoriteTeamDto = Omit<FavoriteTeam, 'league' | 'tier' | 'label'> & {
  league?: unknown;
  tier?: unknown;
  label?: unknown;
};

interface FavoritesResponseDto {
  favorites: FavoriteTeamDto[];
}

/** Fills in the league, tier and label an older API leaves out. */
function readFavoriteTeams(response: FavoritesResponseDto): FavoriteTeam[] {
  return response.favorites.map((favorite) => ({
    ...favorite,
    league: favorite.league === 'ahl' ? 'ahl' : 'nhl',
    tier: readFanTier(favorite.tier),
    label: readCategoryLabel(favorite.label),
  }));
}

/** The signed-in user's favorite teams. */
export async function fetchFavorites(token: string): Promise<FavoriteTeam[]> {
  const response = await get<FavoritesResponseDto>(
    '/api/favorites',
    undefined,
    authHeader(token),
  );
  return readFavoriteTeams(response);
}

export async function addFavorite(
  token: string,
  triCode: string,
  league: League,
): Promise<FavoriteTeam[]> {
  const response = await put<FavoritesResponseDto>(
    withLeagueQuery(`/api/favorites/${encodeURIComponent(triCode)}`, league),
    undefined,
    authHeader(token),
  );
  return readFavoriteTeams(response);
}

export async function removeFavorite(
  token: string,
  triCode: string,
  league: League,
): Promise<FavoriteTeam[]> {
  const response = await del<FavoritesResponseDto>(
    withLeagueQuery(`/api/favorites/${encodeURIComponent(triCode)}`, league),
    authHeader(token),
  );
  return readFavoriteTeams(response);
}

/** After Action Report inbox, newest first. */
export function fetchAfterActionReports(
  token: string,
): Promise<AfterActionReportInbox> {
  return get<AfterActionReportInbox>(
    '/api/after-action-reports',
    undefined,
    authHeader(token),
  );
}

export async function markAfterActionReportRead(
  token: string,
  gameId: number,
): Promise<void> {
  await post<unknown>(
    `/api/after-action-reports/${gameId}/read`,
    undefined,
    authHeader(token),
  );
}

export function markAllAfterActionReportsRead(
  token: string,
): Promise<AfterActionReportInbox> {
  return post<AfterActionReportInbox>(
    '/api/after-action-reports/read-all',
    undefined,
    authHeader(token),
  );
}

/** Mutes or unmutes phone push for one favorite team. */
export async function setFavoritePushMuted(
  token: string,
  triCode: string,
  league: League,
  muted: boolean,
): Promise<FavoriteTeam[]> {
  const response = await put<FavoritesResponseDto>(
    withLeagueQuery(
      `/api/favorites/${encodeURIComponent(triCode)}/push-mute`,
      league,
    ),
    { muted },
    authHeader(token),
  );
  return readFavoriteTeams(response);
}

/** Sets a favorite team's fan tier and label; a null label clears it. */
export async function updateFavoriteTeamCategory(
  token: string,
  triCode: string,
  league: League,
  category: FavoriteCategory,
): Promise<FavoriteTeam[]> {
  const response = await patch<FavoritesResponseDto>(
    withLeagueQuery(`/api/favorites/${encodeURIComponent(triCode)}`, league),
    category,
    authHeader(token),
  );
  return readFavoriteTeams(response);
}
