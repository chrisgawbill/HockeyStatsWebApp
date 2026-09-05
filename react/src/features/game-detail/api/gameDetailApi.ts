import { get } from '@/lib/apiClient';

/**
 * Single-game endpoints. `GetGameDetails` (boxscore) is also used by the
 * schedule feature to refresh live scores in place.
 */
export async function GetGameLanding(gameID: number) {
  return get(`/schedule/landing/${gameID}`);
}
export async function GetGameDetails(gameID: number) {
  return get(`/schedule/${gameID}`);
}
