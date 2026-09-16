import { describe, expect, it } from 'vitest';
import { StandingsTeamDto } from '@/features/standings/api/standingsApi';
import { CreateLeagueStandingsArray } from '@/features/standings/utils/leagueStandingsHelper';

const team: StandingsTeamDto = {
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

describe('CreateLeagueStandingsArray', () => {
  it('uses the NHL logo matching a known team when the API omits one', () => {
    expect(CreateLeagueStandingsArray([team])[0].teamLogo).toBe(
      'https://assets.nhle.com/logos/nhl/svg/BUF_light.svg',
    );
  });
});
