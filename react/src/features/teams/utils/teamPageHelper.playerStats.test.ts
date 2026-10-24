import { describe, expect, it } from 'vitest';
import { transformPlayerStats } from '@/features/teams/utils/teamPageHelper';
import { SkaterSummaryContract } from '@/features/teams/types/teamPageTypes';

const centerSummary = {
  playerId: 29,
  name: 'Nathan MacKinnon',
  position: 'C',
  gamesPlayed: 10,
  faceoffWinPct: 0.52,
} as SkaterSummaryContract;

describe('transformPlayerStats', () => {
  it('merges zone faceoff totals by playerId', () => {
    const [statLine] = transformPlayerStats([centerSummary], null, {
      data: [
        {
          playerId: 29,
          offensiveZoneFaceoffs: 210,
          defensiveZoneFaceoffs: 180,
        },
      ],
    });
    expect(statLine.offensiveZoneFaceoffs).toBe(210);
    expect(statLine.defensiveZoneFaceoffs).toBe(180);
  });
});
