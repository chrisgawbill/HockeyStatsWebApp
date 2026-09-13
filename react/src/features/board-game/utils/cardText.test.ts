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
  it('falls back to card.text when no role is given', () => {
    expect(cardText(makeCard())).toBe('5 block');
  });

  it('leaves text unchanged for a role with no matching perk', () => {
    expect(cardText(makeCard(), 'C')).toBe('5 block');
  });

  it('adds the defense perk bonus to a block card for LD/RD', () => {
    expect(cardText(makeCard(), 'LD')).toBe('7 block');
    expect(cardText(makeCard(), 'RD')).toBe('7 block');
  });

  it('no longer applies a damage perk to a shot card for LW/RW (BG-A14b: the wing bonus moved to shot accuracy)', () => {
    const card = makeCard({
      id: 'wrist_shot',
      text: '7 damage',
      tags: ['shot'],
      allowedIn: ['shot'],
      effects: [{ type: 'damage', amount: 7 }],
    });
    expect(cardText(card, 'LW')).toBe('7 damage');
    expect(cardText(card, 'RW')).toBe('7 damage');
  });

  it('preserves draw and exhaust suffixes in order', () => {
    const card = makeCard({
      id: 'stickhandle',
      text: '3 damage, draw 1',
      tags: ['skill'],
      effects: [
        { type: 'damage', amount: 3 },
        { type: 'draw', amount: 1 },
      ],
    });
    expect(cardText(card, 'C')).toBe('3 damage, draw 1');

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
  it('returns null with no role', () => {
    expect(cardPerkBadge(makeCard())).toBeNull();
  });

  it('returns null when no perk applies', () => {
    expect(cardPerkBadge(makeCard(), 'C')).toBeNull();
  });

  it('returns a badge string when a perk applies', () => {
    expect(cardPerkBadge(makeCard(), 'LD')).toBe('LD +2');
  });
});
