import { listAvailableLeaders } from '@/features/stat-leaders/utils/availableLeaders';
import { makeLeader } from '@/test/fixtures/availableLeaders';
import { describe, expect, it } from 'vitest';

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
