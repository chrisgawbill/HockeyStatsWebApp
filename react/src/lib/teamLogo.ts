import type { Theme } from '@/lib/themeSchedule';

/** Returns the NHL logo drawn for the current theme's background. */
export function getTeamLogoUrl(triCode: string, theme: Theme): string {
  const logoVariant = theme === 'dark' ? 'dark' : 'light';
  return `https://assets.nhle.com/logos/nhl/svg/${triCode}_${logoVariant}.svg`;
}
