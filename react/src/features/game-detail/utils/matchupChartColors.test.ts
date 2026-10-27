import { describe, expect, it } from 'vitest';
import { localTeamList } from '@/lib/teamListData';
import {
  areDistinctSeriesColors,
  isUsableMarkColor,
} from '@/features/game-detail/utils/chartColorMath';
import { pickMatchupChartColors } from '@/features/game-detail/utils/matchupChartColors';

const THEMES = ['light', 'dark'] as const;

describe('pickMatchupChartColors', () => {
  it('keeps both team colors when they are distinct (TOR navy, BOS gold)', () => {
    // Toronto's navy is lightened for dark mode; Boston's black is too grey,
    // so its gold secondary is used.
    expect(pickMatchupChartColors('TOR', 'BOS')).toEqual({
      home: { light: '#294e8d', dark: '#5e86ca' },
      away: { light: '#b68100', dark: '#c28a01' },
    });
  });

  it('moves the away team to chart blue when both teams are red (CHI vs DET)', () => {
    const colors = pickMatchupChartColors('CHI', 'DET');
    expect(colors.away).toEqual({ light: '#2a78d6', dark: '#3987e5' });
  });

  it('gives a team with no usable color the chart blue', () => {
    expect(pickMatchupChartColors('LAK', 'EDM').home).toEqual({
      light: '#2a78d6',
      dark: '#3987e5',
    });
  });

  it('passes contrast and stays distinct in both themes for every matchup', () => {
    const triCodes = localTeamList.map((team) => team.triCode);
    for (const home of triCodes) {
      for (const away of triCodes) {
        if (home === away) continue;
        const colors = pickMatchupChartColors(home, away);
        for (const theme of THEMES) {
          expect(isUsableMarkColor(colors.home[theme], theme)).toBe(true);
          expect(isUsableMarkColor(colors.away[theme], theme)).toBe(true);
          expect(
            areDistinctSeriesColors(colors.home[theme], colors.away[theme]),
            `${home} vs ${away} (${theme})`,
          ).toBe(true);
        }
      }
    }
  });
});
