import {
  buildPlayerStatCells,
  getPositionLabel,
  parseToiLabel,
} from '@/features/teams/utils/playerStatsHelper';
import { formatSavePct } from '@/lib/statFormat';
import { lookup } from '@/test/fixtures/teams';
import { describe, expect, it } from 'vitest';

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
