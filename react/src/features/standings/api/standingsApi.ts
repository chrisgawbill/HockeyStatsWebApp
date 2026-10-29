import { get } from '@/lib/apiClient';
import {
  League,
  getLeagueQueryValue,
} from '@/features/league/utils/leagueHelper';

export interface StandingsTeamDto {
  teamId: string;
  teamLogo: string;
  name: string;
  conferenceName: string;
  divisionName: string;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  pointPctg: number;
  leagueSequence: number;
  conferenceSequence: number;
  divisionSequence: number;
  wildcardSequence: number;
  clinchingIndicator: string;
  leagueL10Sequence: number;
}

export interface StandingsResponseDto {
  standings: StandingsTeamDto[];
}

/** Season-wide league standings (`GET /standings`). */
export function GetCurrentStandings(
  season?: string,
  league: League = 'nhl',
): Promise<StandingsResponseDto> {
  return get<StandingsResponseDto>('/standings', {
    season,
    league: getLeagueQueryValue(league),
  });
}
