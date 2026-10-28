import { CARDS } from '@/features/board-game/data/cards';
import type { DuelKind } from '@/features/board-game/types/game';
import { describe, expect, it } from 'vitest';

const ORDINARY_KINDS: DuelKind[] = ['deke', 'check', 'intercept'];

/** Ids of every card legal in `kind` for either side, sorted. */
function cardsAllowedIn(kind: DuelKind): string[] {
  return Object.values(CARDS)
    .filter((card) => card.allowedIn[kind])
    .map((card) => card.id)
    .sort();
}

describe('card library', () => {
  it('gives every card non-empty, valid contexts and concise copy', () => {
    for (const card of Object.values(CARDS)) {
      const contexts = Object.entries(card.allowedIn);
      expect(contexts.length, card.id).toBeGreaterThan(0);
      for (const [, sides] of contexts) {
        expect(sides!.length, card.id).toBeGreaterThan(0);
        for (const side of sides!)
          expect(['possession', 'challenger']).toContain(side);
      }
      expect(card.text.length, card.id).toBeGreaterThan(0);
      expect(card.text).not.toMatch(/damage|block/);
    }
  });

  it('keeps ordinary battles to ordinary cards and the shot/faceoff pools unchanged', () => {
    for (const kind of ORDINARY_KINDS) {
      for (const id of cardsAllowedIn(kind)) {
        const card = CARDS[id];
        expect(card.allowedIn.shot, id).toBeUndefined();
        expect(card.allowedIn.faceoff, id).toBeUndefined();
        expect(card.tags, id).not.toContain('shot');
        expect(card.tags, id).not.toContain('faceoff');
      }
    }
    expect(cardsAllowedIn('shot')).toEqual(
      ['one_timer', 'slapshot', 'snap_shot', 'wrist_shot'].sort(),
    );
    expect(cardsAllowedIn('faceoff')).toEqual(
      [
        'body_the_dot',
        'cheat_the_draw',
        'forehand_pull',
        'quick_hands',
        'tie_it_up',
        'win_it_back',
      ].sort(),
    );
  });

  it('pairs every breaks-resistance card with pressure, the only effect it boosts', () => {
    const breakers = Object.values(CARDS).filter((card) =>
      card.effects.some((effect) => effect.type === 'breakResistance'),
    );
    expect(breakers.map((card) => card.id).sort()).toEqual([
      'lift_the_stick',
      'pin_to_boards',
      'saucer_pass',
    ]);
    for (const card of breakers)
      expect(card.effects.some((effect) => effect.type === 'damage')).toBe(
        true,
      );
  });

  it('offers the approved net-front cards on the correct battle sides', () => {
    const possessionCards = Object.values(CARDS)
      .filter((card) => card.allowedIn.netFront?.includes('possession'))
      .map((card) => card.id)
      .sort();
    const challengerCards = Object.values(CARDS)
      .filter((card) => card.allowedIn.netFront?.includes('challenger'))
      .map((card) => card.id)
      .sort();
    expect(possessionCards).toEqual([
      'brace_for_contact',
      'establish_position',
      'find_the_rebound',
      'hold_your_ground',
      'shield_the_puck',
    ]);
    expect(challengerCards).toEqual([
      'body_check',
      'clear_the_crease',
      'front_the_shooter',
      'lift_the_stick',
      'stay_on_him',
    ]);
  });
});
