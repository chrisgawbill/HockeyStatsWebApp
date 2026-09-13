import { describe, expect, it } from 'vitest';
import {
  createDeck,
  discardHand,
  drawCards,
  removeFromHand,
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

describe('drawCards', () => {
  const baseDeck: Deck = {
    drawPile: ['a', 'b'],
    hand: [],
    discardPile: ['c', 'd'],
    exhaustPile: [],
  };

  it('draws from the draw pile without mutating the input deck', () => {
    const [next] = drawCards(baseDeck, 2, 1);
    expect(next.hand).toEqual(['a', 'b']);
    expect(next.drawPile).toEqual([]);
    expect(baseDeck.drawPile).toEqual(['a', 'b']);
    expect(baseDeck.hand).toEqual([]);
  });

  it('reshuffles the discard pile once the draw pile runs out', () => {
    const [next] = drawCards(baseDeck, 4, 1);
    expect(next.hand).toHaveLength(4);
    expect([...next.hand].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(next.drawPile).toEqual([]);
    expect(next.discardPile).toEqual([]);
  });

  it('stops early once both piles are empty', () => {
    const empty: Deck = {
      drawPile: [],
      hand: [],
      discardPile: [],
      exhaustPile: [],
    };
    const [next] = drawCards(empty, 5, 1);
    expect(next.hand).toEqual([]);
  });
});

describe('discardHand', () => {
  it('moves the hand to the discard pile without mutating the input', () => {
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
  });
});

describe('removeFromHand', () => {
  it('sends the card to the discard pile by default', () => {
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
  });

  it('sends the card to the exhaust pile when exhaust is true', () => {
    const deck: Deck = {
      drawPile: [],
      hand: ['a', 'b'],
      discardPile: [],
      exhaustPile: [],
    };
    const next = removeFromHand(deck, 0, true);
    expect(next.hand).toEqual(['b']);
    expect(next.exhaustPile).toEqual(['a']);
  });
});
