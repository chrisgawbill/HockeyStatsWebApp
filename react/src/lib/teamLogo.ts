import type { Theme } from '@/lib/themeSchedule';
import { ahlTeamList } from '@/lib/ahlTeamListData';

/**
 * Returns the team's logo: the NHL one drawn for the current theme's
 * background, or the AHL club's single logo ('' for an unknown AHL code).
 */
export function getTeamLogoUrl(
  triCode: string,
  theme: Theme,
  league: 'nhl' | 'ahl' = 'nhl',
): string {
  if (league === 'ahl') {
    return ahlTeamList.find((team) => team.triCode === triCode)?.logo ?? '';
  }
  const logoVariant = theme === 'dark' ? 'dark' : 'light';
  return `https://assets.nhle.com/logos/nhl/svg/${triCode}_${logoVariant}.svg`;
}
