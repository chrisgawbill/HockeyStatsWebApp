import { describe, expect, it } from 'vitest';
import { cardBlockReasonLabel } from '@/features/board-game/utils/cardBlockReasonLabel';
import type { CardDef } from '@/features/board-game/types/game';

function makeCard(overrides: Partial<CardDef> = {}): CardDef {
  return {
    id: 'deke',
    name: 'Deke',
    cost: 1,
    text: '6 damage',
    tags: ['skill'],
    allowedIn: 'any',
    exhaust: false,
    effects: [{ type: 'damage', amount: 6 }],
    ...overrides,
  };
}

describe('cardBlockReasonLabel', () => {
  it('describes each reason a card cannot be played', () => {
    // Energy shortfalls use the card cost and current energy.
    expect(cardBlockReasonLabel('energy', makeCard({ cost: 2 }), 1)).toBe(
      'Costs 2⚡ · you have 1',
    );
    const cases = [
      ['shotOnly', 'Only when shooting'],
      ['checkOnly', 'Only when checking'],
      ['faceoffOnly', 'Only at a faceoff'],
    ] as const;
    for (const [reason, label] of cases) {
      expect(cardBlockReasonLabel(reason, makeCard(), 3)).toBe(label);
    }
  });
});
