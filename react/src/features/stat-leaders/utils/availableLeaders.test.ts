import { describe, expect, it } from 'vitest';
import { listAvailableLeaders } from '@/features/stat-leaders/utils/availableLeaders';
import { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';
import { PlayerStatLeader } from '@/features/stat-leaders/types/playerStatLeader';

function makeLeader(statIndicator: string): TopStatLeader {
  const player = new PlayerStatLeader(
    1,
    'Connor',
    'McDavid',
    97,
    '',
    'EDM',
    'Oilers',
    '',
    'C',
    true,
    10,
  );
  return new TopStatLeader(statIndicator, player, [player]);
}

describe('listAvailableLeaders', () => {
  it('drops undefined categories and keeps the order', () => {
    const goals = makeLeader('Goals');
    const points = makeLeader('Points');
    expect(listAvailableLeaders([goals, undefined, points])).toEqual([
      goals,
      points,
    ]);
  });

  it('returns an empty list when nothing has loaded', () => {
    expect(listAvailableLeaders([undefined, undefined])).toEqual([]);
  });
});
