import { get } from '@/lib/apiClient';
import {
  League,
  getLeagueQueryValue,
} from '@/features/league/utils/leagueHelper';

export interface StatLeaderDto {
  id: number;
  firstName: string;
  lastName: string;
  sweaterNumber: number;
  headshot: string;
  teamAbbrev: string;
  teamName: string;
  teamLogo: string;
  position: string;
  value: number;
}

/** Skater and goalie leader lists for one stat category (`GET /player/:role/statLeaders/:stat`). */
export function GetSkaterStatLeaders(
  statIndicator: string,
  season?: string,
  league: League = 'nhl',
): Promise<StatLeaderDto[]> {
  return get<StatLeaderDto[]>(`/player/skater/statLeaders/${statIndicator}`, {
    season,
    league: getLeagueQueryValue(league),
  });
}
/** Goalie leaders for one stat category. */
export function GetGoalieStatLeaders(
  statIndicator: string,
  season?: string,
  league: League = 'nhl',
): Promise<StatLeaderDto[]> {
  return get<StatLeaderDto[]>(`/player/goalie/statLeaders/${statIndicator}`, {
    season,
    league: getLeagueQueryValue(league),
  });
}
