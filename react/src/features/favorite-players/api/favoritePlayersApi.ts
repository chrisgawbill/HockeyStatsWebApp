import { del, get, post, put } from '@/lib/apiClient';
import { authHeader } from '@/lib/auth/authApi';
import type {
  FavoritePlayer,
  WeeklyPlayerReport,
  WeeklyPlayerReportInbox,
} from '@/features/favorite-players/types/favoritePlayers';

interface FavoritePlayersResponseDto {
  favorites: FavoritePlayer[];
}

/** The signed-in user's favorite players. */
export async function fetchFavoritePlayers(
  token: string,
): Promise<FavoritePlayer[]> {
  const { favorites } = await get<FavoritePlayersResponseDto>(
    '/api/favorite-players',
    undefined,
    authHeader(token),
  );
  return favorites;
}

/** Rejects with ApiError 409 once the user already has the maximum. */
export async function addFavoritePlayer(
  token: string,
  playerId: number,
): Promise<FavoritePlayer[]> {
  const { favorites } = await put<FavoritePlayersResponseDto>(
    `/api/favorite-players/${playerId}`,
    undefined,
    authHeader(token),
  );
  return favorites;
}

export async function removeFavoritePlayer(
  token: string,
  playerId: number,
): Promise<FavoritePlayer[]> {
  const { favorites } = await del<FavoritePlayersResponseDto>(
    `/api/favorite-players/${playerId}`,
    authHeader(token),
  );
  return favorites;
}

/** Weekly Player Reports, newest first (at most 12). */
export function fetchWeeklyReports(
  token: string,
): Promise<WeeklyPlayerReportInbox> {
  return get<WeeklyPlayerReportInbox>(
    '/api/weekly-player-reports',
    undefined,
    authHeader(token),
  );
}

export function fetchWeeklyReport(
  token: string,
  weekStart: string,
): Promise<WeeklyPlayerReport> {
  return get<WeeklyPlayerReport>(
    `/api/weekly-player-reports/${encodeURIComponent(weekStart)}`,
    undefined,
    authHeader(token),
  );
}

export async function markWeeklyReportRead(
  token: string,
  weekStart: string,
): Promise<void> {
  await post<unknown>(
    `/api/weekly-player-reports/${encodeURIComponent(weekStart)}/read`,
    undefined,
    authHeader(token),
  );
}

/** The one on/off switch for the Monday weekly-report push. */
export async function fetchWeeklyReportPush(token: string): Promise<boolean> {
  const { enabled } = await get<{ enabled: boolean }>(
    '/api/push/weekly-report',
    undefined,
    authHeader(token),
  );
  return enabled;
}

export async function setWeeklyReportPush(
  token: string,
  enabled: boolean,
): Promise<boolean> {
  const result = await put<{ enabled: boolean }>(
    '/api/push/weekly-report',
    { enabled },
    authHeader(token),
  );
  return result.enabled;
}
