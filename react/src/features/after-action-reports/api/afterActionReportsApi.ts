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

type FavoriteTeamDto = Omit<FavoriteTeam, 'tier' | 'label'> & {
  tier?: unknown;
  label?: unknown;
};

interface FavoritesResponseDto {
  favorites: FavoriteTeamDto[];
}

/** Fills in the tier and label an API that predates fan categories leaves out. */
function readFavoriteTeams(response: FavoritesResponseDto): FavoriteTeam[] {
  return response.favorites.map((favorite) => ({
    ...favorite,
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
): Promise<FavoriteTeam[]> {
  const response = await put<FavoritesResponseDto>(
    `/api/favorites/${encodeURIComponent(triCode)}`,
    undefined,
    authHeader(token),
  );
  return readFavoriteTeams(response);
}

export async function removeFavorite(
  token: string,
  triCode: string,
): Promise<FavoriteTeam[]> {
  const response = await del<FavoritesResponseDto>(
    `/api/favorites/${encodeURIComponent(triCode)}`,
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
  muted: boolean,
): Promise<FavoriteTeam[]> {
  const response = await put<FavoritesResponseDto>(
    `/api/favorites/${encodeURIComponent(triCode)}/push-mute`,
    { muted },
    authHeader(token),
  );
  return readFavoriteTeams(response);
}

/** Sets a favorite team's fan tier and label; a null label clears it. */
export async function updateFavoriteTeamCategory(
  token: string,
  triCode: string,
  category: FavoriteCategory,
): Promise<FavoriteTeam[]> {
  const response = await patch<FavoritesResponseDto>(
    `/api/favorites/${encodeURIComponent(triCode)}`,
    category,
    authHeader(token),
  );
  return readFavoriteTeams(response);
}
