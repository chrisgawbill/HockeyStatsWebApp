import { del, get, patch, post, put } from '@/lib/apiClient';
import { authHeader } from '@/lib/auth/authApi';
import {
  readCategoryLabel,
  readFanTier,
  type FavoriteCategory,
} from '@/lib/favoriteCategory';
import type {
  FavoritePlayer,
  WeeklyPlayerReport,
  WeeklyPlayerReportInbox,
} from '@/features/favorite-players/types/favoritePlayers';
import { withLeagueQuery, type League } from '@/lib/league';

type FavoritePlayerDto = Omit<
  FavoritePlayer,
  'league' | 'tier' | 'label' | 'pushMuted'
> & {
  league?: unknown;
  tier?: unknown;
  label?: unknown;
  pushMuted?: unknown;
};

interface FavoritePlayersResponseDto {
  favorites: FavoritePlayerDto[];
}

/** Fills in the league, tier, label and push toggle an older API leaves out. */
function readFavoritePlayers(
  response: FavoritePlayersResponseDto,
): FavoritePlayer[] {
  return response.favorites.map((favorite) => ({
    ...favorite,
    league: favorite.league === 'ahl' ? 'ahl' : 'nhl',
    tier: readFanTier(favorite.tier),
    label: readCategoryLabel(favorite.label),
    pushMuted: favorite.pushMuted === true,
  }));
}

/** The signed-in user's favorite players. */
export async function fetchFavoritePlayers(
  token: string,
): Promise<FavoritePlayer[]> {
  const response = await get<FavoritePlayersResponseDto>(
    '/api/favorite-players',
    undefined,
    authHeader(token),
  );
  return readFavoritePlayers(response);
}

/** Rejects with ApiError 409 once the user already has the maximum. */
export async function addFavoritePlayer(
  token: string,
  playerId: number,
  league: League,
): Promise<FavoritePlayer[]> {
  const response = await put<FavoritePlayersResponseDto>(
    withLeagueQuery(`/api/favorite-players/${playerId}`, league),
    undefined,
    authHeader(token),
  );
  return readFavoritePlayers(response);
}

export async function removeFavoritePlayer(
  token: string,
  playerId: number,
  league: League,
): Promise<FavoritePlayer[]> {
  const response = await del<FavoritePlayersResponseDto>(
    withLeagueQuery(`/api/favorite-players/${playerId}`, league),
    authHeader(token),
  );
  return readFavoritePlayers(response);
}

/** Sets a favorite player's fan tier and label; a null label clears it. */
export async function updateFavoritePlayerCategory(
  token: string,
  playerId: number,
  league: League,
  category: FavoriteCategory,
): Promise<FavoritePlayer[]> {
  const response = await patch<FavoritePlayersResponseDto>(
    withLeagueQuery(`/api/favorite-players/${playerId}`, league),
    category,
    authHeader(token),
  );
  return readFavoritePlayers(response);
}

/** Includes or leaves out one favorite player in the weekly-report push. */
export async function setFavoritePlayerPushMuted(
  token: string,
  playerId: number,
  league: League,
  muted: boolean,
): Promise<FavoritePlayer[]> {
  const response = await put<FavoritePlayersResponseDto>(
    withLeagueQuery(`/api/favorite-players/${playerId}/push-mute`, league),
    { muted },
    authHeader(token),
  );
  return readFavoritePlayers(response);
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
