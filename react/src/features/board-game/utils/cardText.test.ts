import { describe, expect, it } from 'vitest';
import { cardPerkBadge, cardText } from '@/features/board-game/utils/cardText';
import type { CardDef } from '@/features/board-game/types/game';

function makeCard(overrides: Partial<CardDef> = {}): CardDef {
  return {
    id: 'protect_puck',
    name: 'Protect Puck',
    cost: 1,
    text: '5 block',
    tags: ['block'],
    allowedIn: 'any',
    exhaust: false,
    effects: [{ type: 'block', amount: 5 }],
    ...overrides,
  };
}

describe('cardText', () => {
  it('applies role perks only where they match, keeping draw and exhaust suffixes', () => {
    expect(cardText(makeCard())).toBe('5 block');

    // Leaves text unchanged for a role with no matching perk.
    expect(cardText(makeCard(), 'C')).toBe('5 block');

    // Adds the defense perk bonus to a block card for LD/RD.
    expect(cardText(makeCard(), 'LD')).toBe('7 block');
    expect(cardText(makeCard(), 'RD')).toBe('7 block');

    // No longer applies a damage perk to a shot card for LW/RW (BG-A14b: the wing bonus moved to shot accuracy).
    const shot = makeCard({
      id: 'wrist_shot',
      text: '7 damage',
      tags: ['shot'],
      allowedIn: ['shot'],
      effects: [{ type: 'damage', amount: 7 }],
    });
    expect(cardText(shot, 'LW')).toBe('7 damage');
    expect(cardText(shot, 'RW')).toBe('7 damage');

    // Preserves draw and exhaust suffixes in order.
    const stickhandle = makeCard({
      id: 'stickhandle',
      text: '3 damage, draw 1',
      tags: ['skill'],
      effects: [
        { type: 'damage', amount: 3 },
        { type: 'draw', amount: 1 },
      ],
    });
    expect(cardText(stickhandle, 'C')).toBe('3 damage, draw 1');

    const exhaustCard = makeCard({
      id: 'slapshot',
      text: '14 damage, exhaust',
      tags: ['shot'],
      allowedIn: ['shot'],
      exhaust: true,
      effects: [{ type: 'damage', amount: 14 }],
    });
    expect(cardText(exhaustCard, 'LW')).toBe('14 damage, exhaust');
  });
});

describe('cardPerkBadge', () => {
  it('is a badge only when a role perk applies', () => {
    expect(cardPerkBadge(makeCard())).toBeNull();

    // Returns null when no perk applies.
    expect(cardPerkBadge(makeCard(), 'C')).toBeNull();

    // Returns a badge string when a perk applies.
    expect(cardPerkBadge(makeCard(), 'LD')).toBe('LD +2');
  });
});
