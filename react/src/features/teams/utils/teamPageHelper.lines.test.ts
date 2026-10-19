import { describe, expect, it } from 'vitest';
import {
  buildDefensePairs,
  buildForwardLines,
  buildEmptyRoster,
} from '@/features/teams/utils/teamPageHelper';
import { Position, RosterPlayer } from '@/features/teams/types/teamPageTypes';

function player(id: number, name: string): RosterPlayer {
  return { id, name, number: id, stat: '' };
}

function roster(overrides: Partial<Record<Position, RosterPlayer[]>>) {
  return { ...buildEmptyRoster(), ...overrides };
}

describe('buildForwardLines', () => {
  it('zips LW-C-RW by index, omitting exhausted slots and labeling only 4 lines', () => {
    const lines = buildForwardLines(
      roster({
        Center: [player(1, 'C1'), player(2, 'C2')],
        'Left Wing': [player(3, 'LW1'), player(4, 'LW2')],
        'Right Wing': [player(5, 'RW1'), player(6, 'RW2')],
      }),
    );

    expect(lines).toEqual([
      {
        label: 'Line 1',
        players: [player(3, 'LW1'), player(1, 'C1'), player(5, 'RW1')],
      },
      {
        label: 'Line 2',
        players: [player(4, 'LW2'), player(2, 'C2'), player(6, 'RW2')],
      },
    ]);

    // Omits a position slot once that array is exhausted.
    const partial = buildForwardLines(
      roster({
        Center: [player(1, 'C1')],
        'Left Wing': [player(2, 'LW1'), player(3, 'LW2')],
        'Right Wing': [],
      }),
    );

    expect(partial).toEqual([
      { label: 'Line 1', players: [player(2, 'LW1'), player(1, 'C1')] },
      { label: 'Line 2', players: [player(3, 'LW2')] },
    ]);

    // Leaves many past the 4th unlabeled.
    const centers = Array.from({ length: 5 }, (_, i) => player(i, `C${i}`));
    const many = buildForwardLines(roster({ Center: centers }));

    expect(many.map((l) => l.label)).toEqual([
      'Line 1',
      'Line 2',
      'Line 3',
      'Line 4',
      '',
    ]);

    // Returns an empty array for an empty roster.
    expect(buildForwardLines(roster({}))).toEqual([]);
  });
});

describe('buildDefensePairs', () => {
  it('pairs defensemen two at a time, labeling only 3 pairs', () => {
    const pairs = buildDefensePairs(
      roster({
        Defenseman: [
          player(1, 'D1'),
          player(2, 'D2'),
          player(3, 'D3'),
          player(4, 'D4'),
        ],
      }),
    );

    expect(pairs).toEqual([
      { label: 'Pair 1', players: [player(1, 'D1'), player(2, 'D2')] },
      { label: 'Pair 2', players: [player(3, 'D3'), player(4, 'D4')] },
    ]);

    // Leaves a trailing odd player as a single-player pair.
    const odd = buildDefensePairs(
      roster({
        Defenseman: [player(1, 'D1'), player(2, 'D2'), player(3, 'D3')],
      }),
    );

    expect(odd[1]).toEqual({ label: 'Pair 2', players: [player(3, 'D3')] });

    // Leaves many past the 3rd unlabeled.
    const defense = Array.from({ length: 8 }, (_, i) => player(i, `D${i}`));
    const many = buildDefensePairs(roster({ Defenseman: defense }));

    expect(many.map((p) => p.label)).toEqual([
      'Pair 1',
      'Pair 2',
      'Pair 3',
      '',
    ]);
  });
});
