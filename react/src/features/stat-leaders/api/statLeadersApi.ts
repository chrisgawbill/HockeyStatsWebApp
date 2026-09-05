import { get } from '@/lib/apiClient';

/** Skater and goalie leader lists for one stat category (`GET /player/:role/statLeaders/:stat`). */
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
