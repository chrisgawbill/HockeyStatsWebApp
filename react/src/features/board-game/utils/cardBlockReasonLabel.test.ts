import { makeCard } from '@/test/fixtures/boardGame';
import { describe, expect, it } from 'vitest';
import { cardBlockReasonLabel } from '@/features/board-game/utils/cardBlockReasonLabel';

describe('cardBlockReasonLabel', () => {
  it('describes each reason a card cannot be played', () => {
    // Energy shortfalls use the card cost and current energy.
    expect(cardBlockReasonLabel('energy', makeCard({ cost: 2 }), 1)).toBe(
      'Costs 2⚡ · you have 1',
    );
    const cases = [
      ['shotOnly', 'Only when shooting'],
      ['faceoffOnly', 'Only at a faceoff'],
      ['otherBattle', 'Not in this battle'],
      ['otherSide', 'Not for your side'],
    ] as const;
    for (const [reason, label] of cases) {
      expect(cardBlockReasonLabel(reason, makeCard(), 3)).toBe(label);
    }
  });
});
