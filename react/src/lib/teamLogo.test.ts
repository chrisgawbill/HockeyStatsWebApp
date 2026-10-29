import { describe, expect, it } from 'vitest';
import { getTeamLogoUrl } from '@/lib/teamLogo';
import { getTeamPrimaryColor } from '@/lib/teamColor';

describe('league team lookups', () => {
  it('resolves a shared tri-code to the club of the shown league', () => {
    expect(getTeamLogoUrl('TOR', 'light')).toBe(
      'https://assets.nhle.com/logos/nhl/svg/TOR_light.svg',
    );
    expect(getTeamLogoUrl('TOR', 'dark', 'ahl')).toBe(
      'https://assets.leaguestat.com/ahl/logos/335_94.png',
    );
    expect(getTeamLogoUrl('XXX', 'light', 'ahl')).toBe('');
  });

  it('gives AHL clubs the neutral color, never the NHL club sharing the code', () => {
    expect(getTeamPrimaryColor('TOR')).not.toBe('#1f5f99');
    expect(getTeamPrimaryColor('TOR', 'ahl')).toBe('#1f5f99');
  });
});
