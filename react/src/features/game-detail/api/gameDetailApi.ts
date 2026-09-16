import { get } from '@/lib/apiClient';
import {
  GameDetailBoxscore,
  GameLanding,
} from '@/features/game-detail/types/gameDetail';

/**
 * Single-game endpoints. `GetGameDetails` (boxscore) is also used by the
 * schedule feature to refresh live scores in place.
 */
export function GetGameLanding(gameID: number): Promise<GameLanding> {
  return get<GameLanding>(`/schedule/landing/${gameID}`);
}
export function GetGameDetails(gameID: number): Promise<GameDetailBoxscore> {
  return get<GameDetailBoxscore>(`/schedule/${gameID}`);
}
