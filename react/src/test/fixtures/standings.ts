import { StandingsTeamDto } from '@/features/standings/api/standingsApi';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { PlayoffRaceGame } from '@/features/standings/utils/playoffRaceHelper';

export const standingsTeam: StandingsTeamDto = {
  teamId: '7',
  teamLogo: '',
  name: 'Buffalo Sabres',
  conferenceName: 'Eastern',
  divisionName: 'Atlantic',
  wins: 1,
  losses: 1,
  otLosses: 0,
  points: 2,
  pointPctg: 0.5,
  leagueSequence: 20,
  conferenceSequence: 10,
  divisionSequence: 5,
  wildcardSequence: 2,
  clinchingIndicator: '',
  leagueL10Sequence: 20,
};

export function team(id: string, place: number, points: number): StandingsTeam {
  return new StandingsTeam(
    id,
    '',
    id,
    'Eastern',
    '',
    0,
    0,
    0,
    points,
    0,
    place,
    place,
    place,
    0,
    '',
    0,
    '',
  );
}
export function game(
  homeTeam: string,
  awayTeam: string,
  gameState = 'FUT',
): PlayoffRaceGame {
  return {
    homeTeam,
    awayTeam,
    gameState,
    isPlayoff: false,
    isPreseason: false,
  };
}
