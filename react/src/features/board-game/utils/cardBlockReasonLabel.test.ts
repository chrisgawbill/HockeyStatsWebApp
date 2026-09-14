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
  it('describes an energy shortfall using the card cost and current energy', () => {
    expect(cardBlockReasonLabel('energy', makeCard({ cost: 2 }), 1)).toBe(
      'Costs 2⚡ · you have 1',
    );
  });

  it('describes a shot-only card', () => {
    expect(cardBlockReasonLabel('shotOnly', makeCard(), 3)).toBe(
      'Only when shooting',
    );
  });

  it('describes a check-only card', () => {
    expect(cardBlockReasonLabel('checkOnly', makeCard(), 3)).toBe(
      'Only when checking',
    );
  });

  it('describes a faceoff-only card', () => {
    expect(cardBlockReasonLabel('faceoffOnly', makeCard(), 3)).toBe(
      'Only at a faceoff',
    );
  });
});
