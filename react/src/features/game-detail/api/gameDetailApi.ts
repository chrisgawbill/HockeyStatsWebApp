import { get } from '@/lib/apiClient';
import {
  League,
  getLeagueQueryValue,
} from '@/features/league/utils/leagueHelper';
import {
  GameDetailBoxscore,
  GameLanding,
} from '@/features/game-detail/types/gameDetail';
import { GamePlayByPlay } from '@/features/game-detail/types/playByPlay';

/**
 * Single-game endpoints. `GetGameDetails` (boxscore) is also used by the
 * schedule feature to refresh live scores in place.
 */
export function GetGameLanding(gameID: number): Promise<GameLanding> {
  return get<GameLanding>(`/schedule/landing/${gameID}`);
}
/** A game's boxscore. */
export function GetGameDetails(
  gameID: number,
  league: League = 'nhl',
): Promise<GameDetailBoxscore> {
  return get<GameDetailBoxscore>(`/schedule/${gameID}`, {
    league: getLeagueQueryValue(league),
  });
}
/** A game's shot and goal events for the shot map and game flow (404 until the API route deploys). */
export function GetGamePlayByPlay(gameID: number): Promise<GamePlayByPlay> {
  return get<GamePlayByPlay>(`/schedule/playbyplay/${gameID}`);
}
