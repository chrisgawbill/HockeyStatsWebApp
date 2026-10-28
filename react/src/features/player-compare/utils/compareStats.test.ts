import { buildCompareRows } from '@/features/player-compare/utils/compareStats';
import { mcdavid, skaterSlots } from '@/test/fixtures/players';
import { makeGoalie, makeSkater } from '@/test/fixtures/players';
import { describe, expect, it } from 'vitest';

/** The row with this label, as [text, isBest] pairs per column. */
function readRow(rows: ReturnType<typeof buildCompareRows>, label: string) {
  const row = rows.find((candidate) => candidate.label === label);
  if (!row) throw new Error(`No ${label} row`);
  return row.cells.map((cell) => [cell.text, cell.isBest]);
}

describe('buildCompareRows for skaters', () => {
  const rows = buildCompareRows('skater', skaterSlots);

  it('lists the skater stats in order', () => {
    expect(rows.map((row) => row.label)).toEqual([
      'GP',
      'G',
      'A',
      'P',
      'PPG',
      '+/-',
      'SOG',
      'S%',
      'TOI/GP',
    ]);
  });

  it('never marks games played', () => {
    expect(readRow(rows, 'GP')).toEqual([
      ['30', false],
      ['30', false],
      ['28', false],
    ]);
  });

  it('marks both tied goal leaders', () => {
    expect(readRow(rows, 'G')).toEqual([
      ['17', false],
      ['19', true],
      ['19', true],
    ]);
  });

  it('computes points per game and marks the best', () => {
    expect(readRow(rows, 'PPG')).toEqual([
      ['1.70', true],
      ['1.60', false],
      ['1.21', false],
    ]);
  });

  it('ties shooting percentages that display the same', () => {
    expect(readRow(rows, 'S%')).toEqual([
      ['17.3', true],
      ['15.7', false],
      ['17.3', true],
    ]);
  });

  it('formats plus/minus and time on ice', () => {
    expect(readRow(rows, '+/-')).toEqual([
      ['+6', false],
      ['+11', true],
      ['-2', false],
    ]);
    expect(readRow(rows, 'TOI/GP')).toEqual([
      ['22:04', false],
      ['22:31', true],
      ['20:47', false],
    ]);
  });

  it('shows a dash for points per game with no games played', () => {
    const rookieRows = buildCompareRows('skater', [
      { kind: 'player', player: mcdavid },
      { kind: 'player', player: makeSkater({ playerId: 9 }) },
    ]);
    expect(readRow(rookieRows, 'PPG')).toEqual([
      ['1.70', false],
      ['—', false],
    ]);
  });
});

describe('buildCompareRows for goalies', () => {
  const shesterkin = makeGoalie({
    playerId: 100,
    gamesPlayed: 24,
    wins: 15,
    goalsAgainstAverage: 2.312,
    savePct: 0.9214,
    shutouts: 2,
  });
  const saros = makeGoalie({
    playerId: 101,
    gamesPlayed: 22,
    wins: 11,
    goalsAgainstAverage: 2.738,
    savePct: 0.908,
    shutouts: 2,
  });

  it('marks the lowest goals-against average', () => {
    const rows = buildCompareRows('goalie', [
      { kind: 'player', player: saros },
      { kind: 'player', player: shesterkin },
    ]);
    expect(rows.map((row) => row.label)).toEqual([
      'GP',
      'W',
      'GAA',
      'SV%',
      'SO',
    ]);
    expect(readRow(rows, 'GAA')).toEqual([
      ['2.74', false],
      ['2.31', true],
    ]);
    expect(readRow(rows, 'SV%')).toEqual([
      ['.908', false],
      ['.921', true],
    ]);
    expect(readRow(rows, 'SO')).toEqual([
      ['2', false],
      ['2', false],
    ]);
  });

  it('skips an unknown or other-group slot when finding the best', () => {
    const rows = buildCompareRows('goalie', [
      { kind: 'player', player: shesterkin },
      { kind: 'unknown', playerId: 9999999 },
      { kind: 'otherGroup', player: mcdavid },
      { kind: 'player', player: saros },
    ]);
    expect(readRow(rows, 'W')).toEqual([
      ['15', true],
      ['—', false],
      ['—', false],
      ['11', false],
    ]);
  });
});
