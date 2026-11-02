import { transformPlayerStats } from '@/features/teams/utils/teamPageHelper';
import { centerSummary } from '@/test/fixtures/teams';
import { describe, expect, it } from 'vitest';

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

  it('leaves zone faceoffs null when the faceoff data is unavailable', () => {
    const [statLine] = transformPlayerStats([centerSummary], null, null);
    expect(statLine.offensiveZoneFaceoffs).toBeNull();
    expect(statLine.defensiveZoneFaceoffs).toBeNull();
  });

  it('keeps shooting percentage, or null when an older API leaves it out', () => {
    const [withShooting] = transformPlayerStats(
      [{ ...centerSummary, shootingPct: 0.173 }],
      null,
    );
    expect(withShooting.shootingPct).toBe(0.173);
    const [withoutShooting] = transformPlayerStats([centerSummary], null);
    expect(withoutShooting.shootingPct).toBeNull();
  });
});
