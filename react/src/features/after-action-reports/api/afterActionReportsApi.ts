import { del, get, post, put } from '@/lib/apiClient';
import { authHeader } from '@/lib/auth/authApi';
import type {
  AfterActionReportInbox,
  FavoriteTeam,
} from '@/features/after-action-reports/types/afterActionReport';

interface FavoritesResponseDto {
  favorites: FavoriteTeam[];
}

/** The signed-in user's favorite teams. */
export async function fetchFavorites(token: string): Promise<FavoriteTeam[]> {
  const { favorites } = await get<FavoritesResponseDto>(
    '/api/favorites',
    undefined,
    authHeader(token),
  );
  return favorites;
}

export async function addFavorite(
  token: string,
  triCode: string,
): Promise<FavoriteTeam[]> {
  const { favorites } = await put<FavoritesResponseDto>(
    `/api/favorites/${encodeURIComponent(triCode)}`,
    undefined,
    authHeader(token),
  );
  return favorites;
}

export async function removeFavorite(
  token: string,
  triCode: string,
): Promise<FavoriteTeam[]> {
  const { favorites } = await del<FavoritesResponseDto>(
    `/api/favorites/${encodeURIComponent(triCode)}`,
    authHeader(token),
  );
  return favorites;
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
