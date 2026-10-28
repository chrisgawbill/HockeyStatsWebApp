import { CreateLeagueStandingsArray } from '@/features/standings/utils/leagueStandingsHelper';
import { standingsTeam as team } from '@/test/fixtures/standings';
import { describe, expect, it } from 'vitest';

describe('CreateLeagueStandingsArray', () => {
  it('uses the NHL logo matching a known team when the API omits one', () => {
    expect(CreateLeagueStandingsArray([team])[0].teamLogo).toBe(
      'https://assets.nhle.com/logos/nhl/svg/BUF_light.svg',
    );
  });
});
