import { describe, expect, it } from 'vitest';
import {
  buildPlayerStatCells,
  buildStatsLookup,
  getPositionLabel,
  parseToiLabel,
} from '@/features/teams/utils/playerStatsHelper';
import { formatSavePct } from '@/lib/statFormat';

const lookup = buildStatsLookup(
  [
    {
      playerId: 1,
      name: 'A',
      position: 'L',
      gamesPlayed: 10,
      goals: 4,
      assists: 6,
      points: 10,
      plusMinus: 3,
      penaltyMinutes: 0,
      faceoffWinPct: null,
      corsiPct: null,
    },
  ],
  [
    {
      goalieId: 2,
      name: 'G',
      gamesPlayed: 5,
      wins: 3,
      losses: 2,
      savePctg: 0.915,
      goalsAgainstAverage: 2.5,
      shutouts: 1,
    },
  ],
);

describe('playerStatsHelper', () => {
  it('builds skater and goalie cells, or null without a stat line', () => {
    const skater = buildPlayerStatCells(1, 'LW', lookup, '18:22 TOI');
    expect(skater?.map((c) => c.value)).toEqual([
      '10',
      '4',
      '6',
      '10',
      '+3',
      '18:22',
    ]);
    expect(buildPlayerStatCells(1, 'LW', lookup, '')?.length).toBe(5);

    // Builds goalie cells.
    const goalie = buildPlayerStatCells(2, 'G', lookup);
    expect(goalie).toEqual([
      { label: 'GP', value: '5' },
      { label: 'W', value: '3' },
      { label: 'L', value: '2' },
      { label: 'SV%', value: '.915' },
      { label: 'GAA', value: '2.50' },
      { label: 'SO', value: '1' },
    ]);

    // Returns null without a stat line.
    expect(buildPlayerStatCells(99, 'C', lookup)).toBeNull();
    expect(buildPlayerStatCells(1, 'G', lookup)).toBeNull();
  });

  it('formats helpers and resolves position labels', () => {
    expect(formatSavePct(null)).toBe('—');
    expect(parseToiLabel('9:05 TOI')).toBe('9:05');
    expect(parseToiLabel('')).toBeNull();

    // Resolves position labels.
    expect(getPositionLabel('C', lookup, 1)).toBe('Center');
    expect(getPositionLabel('F', lookup, 1)).toBe('Left Wing');
    expect(getPositionLabel('D', lookup, 99)).toBe('Defense');
  });
});
