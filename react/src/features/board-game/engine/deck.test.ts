import { describe, expect, it } from 'vitest';
import {
  createDeck,
  discardHand,
  drawFilteredCards,
  drawPaddedOffer,
  removeFromHand,
  returnCardsToDeck,
} from '@/features/board-game/engine/deck';
import type { Deck } from '@/features/board-game/types/game';

describe('createDeck', () => {
  it('shuffles all ids into the draw pile, leaving the input untouched', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const [deck] = createDeck(ids, 1);
    expect([...deck.drawPile].sort()).toEqual([...ids].sort());
    expect(deck.hand).toEqual([]);
    expect(ids).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('drawFilteredCards', () => {
  const isVowel = (id: string) => ['a', 'e'].includes(id);

  it('draws only eligible cards deterministically, reshuffling and dealing short hands safely', () => {
    const deck: Deck = {
      drawPile: ['b', 'a', 'c', 'e', 'd'],
      hand: [],
      discardPile: [],
      exhaustPile: [],
    };
    const [next] = drawFilteredCards(deck, 2, 1, isVowel);
    expect(next.hand).toEqual(['a', 'e']);
    expect([...next.drawPile].sort()).toEqual(['b', 'c', 'd']);
    expect(deck.drawPile).toEqual(['b', 'a', 'c', 'e', 'd']);

    // Reshuffles the discard pile in, without dropping ineligible cards from the deck.
    {
      const deck: Deck = {
        drawPile: ['b'],
        hand: [],
        discardPile: ['a', 'c'],
        exhaustPile: [],
      };
      const [next] = drawFilteredCards(deck, 1, 1, isVowel);
      expect(next.hand).toEqual(['a']);
      // 'b' and 'c' are never eligible and are never removed from the deck.
      expect([...next.drawPile, ...next.discardPile].sort()).toEqual([
        'b',
        'c',
      ]);
    }

    // Deals a short hand and stops when the eligible pool cannot fill n (no throw, no infinite loop).
    {
      const deck: Deck = {
        drawPile: ['b', 'c', 'd'],
        hand: [],
        discardPile: ['f'],
        exhaustPile: [],
      };
      const [next] = drawFilteredCards(deck, 5, 1, isVowel);
      expect(next.hand).toEqual([]);
      // every original card is still present somewhere in the deck
      expect([...next.drawPile, ...next.discardPile].sort()).toEqual([
        'b',
        'c',
        'd',
        'f',
      ]);
    }

    // Is deterministic for a fixed seed.
    {
      const deck: Deck = {
        drawPile: ['b'],
        hand: [],
        discardPile: ['a', 'c', 'e'],
        exhaustPile: [],
      };
      const [next1] = drawFilteredCards(deck, 2, 42, isVowel);
      const [next2] = drawFilteredCards(deck, 2, 42, isVowel);
      expect(next1).toEqual(next2);
    }
  });
});

describe('drawPaddedOffer', () => {
  const isDekeCard = (id: string) => id === 'deke';

  it('fills only the empty slots with the basic action, leaving deck piles untouched by it', () => {
    const deck: Deck = {
      drawPile: ['wrist_shot', 'deke'],
      hand: [],
      discardPile: ['slapshot'],
      exhaustPile: ['deke'],
    };
    const [next] = drawPaddedOffer(deck, 3, 1, isDekeCard, 'shield_the_puck');
    expect(next.hand).toEqual(['deke', 'shield_the_puck', 'shield_the_puck']);
    // The exhausted deke never returns; ineligible cards stay in their piles.
    expect(next.exhaustPile).toEqual(['deke']);
    expect([...next.drawPile, ...next.discardPile].sort()).toEqual([
      'slapshot',
      'wrist_shot',
    ]);

    // A full eligible pool needs no padding.
    {
      const deck: Deck = {
        drawPile: ['deke', 'deke', 'deke', 'deke'],
        hand: [],
        discardPile: [],
        exhaustPile: [],
      };
      const [next] = drawPaddedOffer(deck, 3, 1, isDekeCard, 'stay_on_him');
      expect(next.hand).toEqual(['deke', 'deke', 'deke']);
      expect(next.drawPile).toEqual(['deke']);
    }
  });
});

describe('discardHand', () => {
  it('moves the hand to the discard pile without mutating the input, dropping basic actions', () => {
    const deck: Deck = {
      drawPile: [],
      hand: ['a', 'b'],
      discardPile: ['c'],
      exhaustPile: [],
    };
    const next = discardHand(deck);
    expect(next.hand).toEqual([]);
    expect(next.discardPile).toEqual(['c', 'a', 'b']);
    expect(deck.hand).toEqual(['a', 'b']);

    const padded = discardHand({
      ...deck,
      hand: ['deke', 'shield_the_puck', 'stay_on_him'],
    });
    expect(padded.discardPile).toEqual(['c', 'deke']);
  });
});

describe('returnCardsToDeck', () => {
  it('never shuffles a basic action into the draw pile', () => {
    const deck: Deck = {
      drawPile: ['toe_drag'],
      hand: ['deke', 'shield_the_puck'],
      discardPile: [],
      exhaustPile: [],
    };
    const [next] = returnCardsToDeck(deck, ['deke', 'shield_the_puck'], 1);
    expect(next.hand).toEqual([]);
    expect([...next.drawPile].sort()).toEqual(['deke', 'toe_drag']);
  });
});

describe('removeFromHand', () => {
  it('removeFromHand sends the card to discard, or exhaust when asked', () => {
    const deck: Deck = {
      drawPile: [],
      hand: ['a', 'b', 'c'],
      discardPile: [],
      exhaustPile: [],
    };
    const next = removeFromHand(deck, 1, false);
    expect(next.hand).toEqual(['a', 'c']);
    expect(next.discardPile).toEqual(['b']);
    expect(deck.hand).toEqual(['a', 'b', 'c']);

    // Sends the card to the exhaust pile when exhaust is true.
    {
      const deck: Deck = {
        drawPile: [],
        hand: ['a', 'b'],
        discardPile: [],
        exhaustPile: [],
      };
      const next = removeFromHand(deck, 0, true);
      expect(next.hand).toEqual(['b']);
      expect(next.exhaustPile).toEqual(['a']);
    }
  });
});
