import { describe, expect, it } from 'vitest';
import { buildCompareSlots } from '@/features/player-compare/utils/compareSlots';
import {
  makeGoalie,
  makePool,
  makeSkater,
} from '@/features/player-compare/utils/testPlayers';

const skater = makeSkater({ playerId: 1 });
const otherSkater = makeSkater({ playerId: 2 });
const goalie = makeGoalie({ playerId: 100 });
const pool = makePool([skater, otherSkater, goalie]);

describe('buildCompareSlots', () => {
  it('keeps URL order and takes the group from the first player', () => {
    expect(buildCompareSlots([2, 1], pool)).toEqual({
      group: 'skater',
      slots: [
        { kind: 'player', player: otherSkater },
        { kind: 'player', player: skater },
      ],
    });
  });

  it('gives an unknown id its own slot without hiding the others', () => {
    expect(buildCompareSlots([1, 9999999, 2], pool).slots).toEqual([
      { kind: 'player', player: skater },
      { kind: 'unknown', playerId: 9999999 },
      { kind: 'player', player: otherSkater },
    ]);
  });

  it('takes the group from the first id that is found', () => {
    const { group, slots } = buildCompareSlots([9999999, 100, 1], pool);
    expect(group).toBe('goalie');
    expect(slots[2]).toEqual({ kind: 'otherGroup', player: skater });
  });

  it('has no group when no id is found', () => {
    expect(buildCompareSlots([9999999], pool).group).toBeNull();
    expect(buildCompareSlots([], pool)).toEqual({ group: null, slots: [] });
  });
});
