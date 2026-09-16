import { get } from '@/lib/apiClient';

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
): Promise<StatLeaderDto[]> {
  return get<StatLeaderDto[]>(`/player/skater/statLeaders/${statIndicator}`, {
    season,
  });
}
export function GetGoalieStatLeaders(
  statIndicator: string,
  season?: string,
): Promise<StatLeaderDto[]> {
  return get<StatLeaderDto[]>(`/player/goalie/statLeaders/${statIndicator}`, {
    season,
  });
}
