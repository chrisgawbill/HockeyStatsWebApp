import { localTeamList } from '@/lib/teamListData';
import {
  ChartTheme,
  areDistinctSeriesColors,
  fitMarkColor,
} from '@/features/game-detail/utils/chartColorMath';

/** One team's mark color in each theme. */
export type ThemedColor = Record<ChartTheme, string>;

export interface MatchupChartColors {
  home: ThemedColor;
  away: ThemedColor;
}

const THEMES: ChartTheme[] = ['light', 'dark'];

/** Chart blue and orange (data-viz palette slots 1 and 2) for teams whose own colors cannot be used. */
const FALLBACK_COLORS: ThemedColor[] = [
  { light: '#2a78d6', dark: '#3987e5' },
  { light: '#eb6834', dark: '#d95926' },
];

/** Fits a color to both themes; null unless both work. */
function fitThemedColor(colors: ThemedColor): ThemedColor | null {
  const light = fitMarkColor(colors.light, 'light');
  const dark = fitMarkColor(colors.dark, 'dark');
  return light && dark ? { light, dark } : null;
}

/** A team's primary then secondary color, each fitted to both themes; unusable ones dropped. */
function listTeamColorOptions(triCode: string): ThemedColor[] {
  const team = localTeamList.find((entry) => entry.triCode === triCode);
  if (!team) return [];
  return [team.primary, team.secondary]
    .map((hex) => fitThemedColor({ light: hex, dark: hex }))
    .filter((color): color is ThemedColor => color !== null);
}

/** The fallback colors, fitted to the chart surfaces like the team colors. */
function listFallbackOptions(): ThemedColor[] {
  return FALLBACK_COLORS.map(fitThemedColor).filter(
    (color): color is ThemedColor => color !== null,
  );
}

/** Whether two teams' colors can sit side by side in both themes. */
function areDistinctInBothThemes(home: ThemedColor, away: ThemedColor) {
  return THEMES.every((theme) =>
    areDistinctSeriesColors(home[theme], away[theme]),
  );
}

/**
 * Mark colors for a game's two teams. The home team keeps its own color
 * (primary, else secondary) when it reads on both chart surfaces; otherwise
 * it takes chart blue. The away team tries its primary, then its secondary,
 * then chart blue or orange, taking the first that stays distinct from the
 * home color. The pair is chosen once for both themes, so a team keeps the
 * same color family in light and dark.
 */
export function pickMatchupChartColors(
  homeTriCode: string,
  awayTriCode: string,
): MatchupChartColors {
  const fallbacks = listFallbackOptions();
  const home = listTeamColorOptions(homeTriCode)[0] ?? fallbacks[0];
  const away =
    [...listTeamColorOptions(awayTriCode), ...fallbacks].find((option) =>
      areDistinctInBothThemes(home, option),
    ) ?? fallbacks[1];
  return { home, away };
}
