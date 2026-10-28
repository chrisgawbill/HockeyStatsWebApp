import { describe, expect, it } from 'vitest';
import {
  simulateDraftLottery,
  type LotteryEntrant,
} from '@/features/draft-lottery/utils/draftLotterySim';
import { lotteryTeams as teams } from '@/test/fixtures/draftLottery';

/** rng that returns the given values in order, then repeats the last. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

/** Value in [0,1) that lands on the middle of team `index` for a given draw. */
const hit = (index: number, pool: LotteryEntrant[] = teams) => {
  const total = pool.reduce((s, t) => s + t.odds, 0);
  const before = pool.slice(0, index).reduce((s, t) => s + t.odds, 0);
  return (before + pool[index].odds / 2) / total;
};

describe('simulateDraftLottery', () => {
  it('is deterministic with a stubbed rng (rng=0 picks the worst team)', () => {
    const result = simulateDraftLottery(teams, () => 0);
    expect(result.map((r) => r.id)).toEqual([
      'T1',
      'T2',
      ...teams.slice(2).map((t) => t.id),
    ]);
    expect(result[0]).toMatchObject({ id: 'T1', pick: 1, drawWon: 1 });
    expect(result[1]).toMatchObject({ id: 'T2', pick: 2, drawWon: 2 });
    expect(result.every((r) => r.movement === 0)).toBe(true);
  });

  it('moves an eligible winner straight to the pick', () => {
    // Draw 1 -> team 11 (eligible), draw 2 -> renormalized pool, team 3.
    const pool = teams.filter((t) => t.id !== 'T11');
    const result = simulateDraftLottery(teams, seq(hit(10), hit(2, pool)));
    expect(result[0]).toMatchObject({
      id: 'T11',
      pick: 1,
      movement: 10,
      drawWon: 1,
    });
    expect(result[1]).toMatchObject({ id: 'T3', pick: 2, drawWon: 2 });
    // Remaining teams keep original order: T1, T2, T4...
    expect(result.slice(2, 5).map((r) => r.id)).toEqual(['T1', 'T2', 'T4']);
    expect(result.find((r) => r.id === 'T1')?.movement).toBe(-2);
  });

  it('moves an ineligible draw-1 winner up exactly 10 and gives #1 to the worst team', () => {
    const result = simulateDraftLottery(teams, seq(hit(15), 0));
    const winner = result.find((r) => r.id === 'T16');
    expect(winner).toMatchObject({ pick: 6, movement: 10, drawWon: 1 });
    expect(result[0]).toMatchObject({ id: 'T1', pick: 1, drawWon: null });
    // Draw 2 (rng 0): worst remaining team, T2, takes #2.
    expect(result[1]).toMatchObject({ id: 'T2', pick: 2, drawWon: 2 });
  });

  it('moves an ineligible draw-2 winner up 10 and gives #2 to the worst unplaced team', () => {
    // Draw 1 -> T1. Draw 2 -> T14 (position 14 > 12): lands at #4.
    const pool = teams.slice(1);
    const result = simulateDraftLottery(teams, seq(0, hit(12, pool)));
    expect(result[0]).toMatchObject({ id: 'T1', pick: 1 });
    const winner = result.find((r) => r.id === 'T14');
    expect(winner).toMatchObject({ pick: 4, movement: 10, drawWon: 2 });
    expect(result[1]).toMatchObject({ id: 'T2', pick: 2, drawWon: null });
  });

  it('allows position 12 to take #2 and 11 to take #1', () => {
    const pool = teams.filter((t) => t.id !== 'T11');
    const result = simulateDraftLottery(teams, seq(hit(10), hit(10, pool)));
    expect(result[0].id).toBe('T11');
    expect(result[1]).toMatchObject({ id: 'T12', pick: 2, movement: 10 });
  });

  it('never lets a team win both draws and always assigns picks 1..16 uniquely', () => {
    let state = 12345;
    const rng = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
    for (let run = 0; run < 2000; run++) {
      const result = simulateDraftLottery(teams, rng);
      expect(result).toHaveLength(16);
      expect(result.map((r) => r.pick)).toEqual(
        Array.from({ length: 16 }, (_, i) => i + 1),
      );
      expect(new Set(result.map((r) => r.id)).size).toBe(16);
      const winners = result.filter((r) => r.drawWon !== null);
      expect(winners).toHaveLength(2);
      expect(new Set(winners.map((r) => r.drawWon)).size).toBe(2);
      for (const r of result) {
        expect(r.movement).toBe(r.preLotteryPosition - r.pick);
        expect(r.movement).toBeLessThanOrEqual(10);
      }
    }
  });

  it('weights draw 1 by the listed odds (team #1 wins ~18.5%)', () => {
    let state = 987654321;
    const rng = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
    const runs = 20000;
    let wins = 0;
    let lastWins = 0;
    for (let i = 0; i < runs; i++) {
      const result = simulateDraftLottery(teams, rng);
      if (result.some((r) => r.id === 'T1' && r.drawWon === 1)) wins++;
      if (result.some((r) => r.id === 'T16' && r.drawWon === 1)) lastWins++;
    }
    expect(wins / runs).toBeGreaterThan(0.17);
    expect(wins / runs).toBeLessThan(0.2);
    expect(lastWins / runs).toBeLessThan(0.015);
  });

  it('handles empty input', () => {
    expect(simulateDraftLottery([])).toEqual([]);
  });
});
