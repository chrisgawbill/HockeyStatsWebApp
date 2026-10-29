import { describe, expect, it } from 'vitest';
import { computeTeamTotals } from '@/features/game-detail/utils/gameDetailHelper';
import { BoxscoreSkater } from '@/features/game-detail/types/gameDetail';

/** A skater row with the stats the totals read; the rest are zero. */
function skater(overrides: Partial<BoxscoreSkater>): BoxscoreSkater {
  return {
    playerId: 1,
    sweaterNumber: 1,
    name: { default: 'A. Player' },
    position: 'C',
    goals: 0,
    assists: 0,
    points: 0,
    plusMinus: 0,
    pim: 2,
    hits: 1,
    powerPlayGoals: 1,
    sog: 0,
    faceoffWinningPctg: null,
    toi: '10:00',
    blockedShots: 0,
    shifts: 10,
    giveaways: 1,
    takeaways: 0,
    ...overrides,
  };
}

describe('computeTeamTotals', () => {
  it('sums every tracked stat', () => {
    const totals = computeTeamTotals(
      { forwards: [skater({}), skater({})], defense: [], goalies: [] },
      20,
    );
    expect(totals).toMatchObject({ pim: 4, powerPlayGoals: 2, giveaways: 2 });
  });

  it('leaves stats the AHL feed lacks as null instead of 0', () => {
    const ahlSkater = skater({
      powerPlayGoals: null,
      giveaways: null,
      takeaways: null,
    });
    const totals = computeTeamTotals(
      { forwards: [ahlSkater], defense: [], goalies: [] },
      20,
    );
    expect(totals).toMatchObject({
      pim: 2,
      powerPlayGoals: null,
      giveaways: null,
      takeaways: null,
    });
  });
});
