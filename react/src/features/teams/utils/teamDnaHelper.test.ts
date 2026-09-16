import { describe, expect, it } from 'vitest';
import { TeamResult } from '@/features/teams/utils/teamFormHelper';
import { buildTeamDna } from '@/features/teams/utils/teamDnaHelper';

function result(
  date: string,
  gf: number,
  ga: number,
  home: boolean,
  otl = false,
): TeamResult {
  return {
    date: new Date(date),
    outcome: gf > ga ? 'W' : otl ? 'OTL' : 'L',
    won: gf > ga,
    otl,
    gf,
    ga,
    home,
  };
}

const emptySplits = {
  home: { games: 0, wins: 0, losses: 0, otl: 0, gf: 0, ga: 0 },
  road: { games: 0, wins: 0, losses: 0, otl: 0, gf: 0, ga: 0 },
};

describe('buildTeamDna', () => {
  it('uses raw values and deterministic normalized bars', () => {
    const results = [
      result('2025-10-01', 4, 2, true),
      result('2025-10-03', 2, 3, false, true),
    ];
    const metrics = buildTeamDna({
      stats: { name: 'Example', goalsForPerGame: 3, goalsAgainstPerGame: 2.5 },
      results,
      recent: results,
      splits: {
        home: { ...emptySplits.home, games: 1, wins: 1 },
        road: { ...emptySplits.road, games: 1, otl: 1 },
      },
    });

    expect(metrics.map((metric) => metric.key)).toEqual([
      'season-points',
      'goal-differential',
      'scoring-environment',
      'home-points',
      'road-points',
      'recent-points',
    ]);
    expect(metrics[0].value).toBe('75.0%');
    expect(metrics[1].value).toBe('+0.50');
    expect(metrics[2].value).toBe('5.50 goals/game');
    expect(metrics[1].normalized).toBe(58);
  });

  it('omits metrics that lack completed or supported data', () => {
    expect(
      buildTeamDna({
        stats: { name: 'Example' },
        results: [],
        recent: [],
        splits: emptySplits,
      }),
    ).toEqual([]);
  });
});
