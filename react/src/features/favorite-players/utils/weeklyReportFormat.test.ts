import {
  didNotPlayText,
  formatSavePct,
  goalieStatItems,
  isWeekStart,
  skaterStatItems,
  teamsLabel,
  weeklyReportTitle,
} from '@/features/favorite-players/utils/weeklyReportFormat';
import { makeWeeklyPlayer as player } from '@/test/fixtures/reports';
import { describe, expect, it } from 'vitest';

describe('weeklyReportFormat', () => {
  it('formats the approved skater and goalie lines', () => {
    expect(
      skaterStatItems({
        gp: 3,
        goals: 2,
        assists: 4,
        points: 6,
        plusMinus: 3,
        shots: 11,
        toiPerGame: '21:42',
        bestGame: null,
      }),
    ).toEqual([
      '3 GP',
      '2 G',
      '4 A',
      '6 PTS',
      '+3 +/-',
      '11 SOG',
      '21:42 TOI/GP',
    ]);

    // Formats the approved goalie line.
    expect(
      goalieStatItems({
        gp: 2,
        wins: 1,
        losses: 0,
        otLosses: 1,
        record: '1-0-1',
        savePct: 0.918,
        gaa: 2.479,
        shutouts: 0,
      }),
    ).toEqual(['2 GP', '1-0-1', '.918 SV%', '2.48 GAA', '0 SO']);
    expect(formatSavePct(1)).toBe('1.000');
    expect(formatSavePct(null)).toBe('—');
  });

  it('describes did-not-play and traded players, titles, and validates weeks', () => {
    expect(didNotPlayText(player({ teamGames: 3 }))).toBe(
      'Did not play (team played 3 games)',
    );
    expect(didNotPlayText(player({ teamGames: 1 }))).toBe(
      'Did not play (team played 1 game)',
    );
    expect(didNotPlayText(player({ teamGames: 0 }))).toBe(
      'Did not play (team did not play)',
    );
    expect(teamsLabel(player({ teams: ['CGY', 'EDM'] }))).toBe('CGY → EDM');
    expect(teamsLabel(player({ teams: [], team: 'VAN' }))).toBe('VAN');

    // Titles and validates weeks.
    expect(weeklyReportTitle({ label: 'Oct 13–19' })).toBe(
      'Weekly Player Report · Oct 13–19',
    );
    expect(isWeekStart('2026-10-12')).toBe(true);
    expect(isWeekStart('2026-10-13')).toBe(false);
    expect(isWeekStart('2026-02-30')).toBe(false);
    expect(isWeekStart(undefined)).toBe(false);
  });
});
