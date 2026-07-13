import { AxiosRequestConfig } from 'axios';
import { axiosExpressHandler } from './axiosInstance';

/**
 * Frontend API client: one async function per backend operation. Each issues a
 * GET through the shared axios instance, returns `response.data`, and logs then
 * re-throws on failure so callers can surface their own loading/empty states.
 * Season-aware calls take an optional `season` and thread it through `withParams`.
 */

const DIAGNOSTICS_HEADER = 'x-diagnostics-key';

/**
 * Appends only the defined params to `path` as a query string (empty/undefined
 * values are dropped), so `?season=` etc. is added only when actually set.
 */
function withParams(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Shared GET wrapper: applies `withParams` when params are given, returns
 * `response.data`, and logs then re-throws so callers keep their own error UI.
 */
async function get<T = any>(
  path: string,
  params?: Record<string, string | undefined>,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const url = params ? withParams(path, params) : path;
    const response = await axiosExpressHandler.get<T>(url, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching data: ', error);
    throw error;
  }
}

export async function GetCurrentStandings(season?: string) {
  return get('/standings', { season });
}
export async function GetSkaterStatLeaders(
  statIndicator: string,
  season?: string,
) {
  return get(`/player/skater/statLeaders/${statIndicator}`, { season });
}
export async function GetGoalieStatLeaders(
  statIndicator: string,
  season?: string,
) {
  return get(`/player/goalie/statLeaders/${statIndicator}`, { season });
}
export async function GetTeamStatsById(teamId: string, season?: string) {
  return get(`/team/${teamId}`, { season });
}
export async function GetScheduledGames(season?: string) {
  return get('/schedule/', { season });
}
export async function GetGameLanding(gameID: number) {
  return get(`/schedule/landing/${gameID}`);
}
export async function GetGameDetails(gameID: number) {
  return get(`/schedule/${gameID}`);
}
export async function GetTeamRoster(triCode: string, season?: string) {
  return get(`/team/roster/${triCode}`, { season });
}
export async function GetTeamSchedule(triCode: string, season?: string) {
  return get(`/team/schedule/${triCode}`, { season });
}
export async function GetSkaterSummary(teamId?: string, season?: string) {
  return get('/player/skater/summary', { teamId, season });
}
export async function GetSkaterCorsi(teamId?: string, season?: string) {
  return get('/player/skater/corsi', { teamId, season });
}
export async function GetGoalieSummary(teamId?: string, season?: string) {
  return get('/player/goalie/summary', { teamId, season });
}
export async function GetHealth(passphrase: string) {
  return get('/health', undefined, {
    headers: { [DIAGNOSTICS_HEADER]: passphrase },
  });
}
export async function GetCacheReport(passphrase: string) {
  return get('/health/cache-usage', undefined, {
    headers: { [DIAGNOSTICS_HEADER]: passphrase },
  });
}
