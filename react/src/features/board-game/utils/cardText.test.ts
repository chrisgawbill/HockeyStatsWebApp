import { makeCard } from '@/test/fixtures/boardGame';
import { describe, expect, it } from 'vitest';
import { cardPerkBadge, cardText } from '@/features/board-game/utils/cardText';

describe('cardText', () => {
  it('applies role perks only where they match, keeping draw and exhaust suffixes', () => {
    expect(cardText(makeCard())).toBe('5 resistance');

    // Leaves text unchanged for a role with no matching perk.
    expect(cardText(makeCard(), 'C')).toBe('5 resistance');

    // Adds the defense perk bonus to a block card for LD/RD.
    expect(cardText(makeCard(), 'LD')).toBe('7 resistance');
    expect(cardText(makeCard(), 'RD')).toBe('7 resistance');

    // No longer applies a damage perk to a shot card for LW/RW (BG-A14b: the wing bonus moved to shot accuracy).
    const shot = makeCard({
      id: 'wrist_shot',
      text: '7 pressure',
      tags: ['shot'],
      allowedIn: { shot: ['possession'] },
      effects: [{ type: 'damage', amount: 7 }],
    });
    expect(cardText(shot, 'LW')).toBe('7 pressure');
    expect(cardText(shot, 'RW')).toBe('7 pressure');

    // Preserves draw and exhaust suffixes in order.
    const stickhandle = makeCard({
      id: 'stickhandle',
      text: '3 pressure, draw 1',
      tags: ['skill'],
      effects: [
        { type: 'damage', amount: 3 },
        { type: 'draw', amount: 1 },
      ],
    });
    expect(cardText(stickhandle, 'C')).toBe('3 pressure, draw 1');

    const exhaustCard = makeCard({
      id: 'slapshot',
      text: '14 pressure, exhaust',
      tags: ['shot'],
      allowedIn: { shot: ['possession'] },
      exhaust: true,
      effects: [{ type: 'damage', amount: 14 }],
    });
    expect(cardText(exhaustCard, 'LW')).toBe('14 pressure, exhaust');

    // Names a breaks-resistance effect after the pressure it comes with.
    const saucerPass = makeCard({
      id: 'saucer_pass',
      text: '4 pressure, breaks resistance',
      tags: ['skill'],
      allowedIn: { intercept: ['possession'] },
      effects: [{ type: 'damage', amount: 4 }, { type: 'breakResistance' }],
    });
    expect(cardText(saucerPass, 'C')).toBe('4 pressure, breaks resistance');
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
