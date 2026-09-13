import { shuffle } from '@/features/board-game/engine/rng';
import type { Deck } from '@/features/board-game/types/game';

/** Builds a fresh deck with `ids` shuffled into the draw pile. */
export function createDeck(ids: string[], seed: number): [Deck, number] {
  const [drawPile, nextSeed] = shuffle(ids, seed);
  return [{ drawPile, hand: [], discardPile: [], exhaustPile: [] }, nextSeed];
}

/**
 * Draws up to `n` cards into the hand, reshuffling the discard pile into the
 * draw pile when it runs out. Stops early once both piles are empty.
 */
export function drawCards(deck: Deck, n: number, seed: number): [Deck, number] {
  let drawPile = [...deck.drawPile];
  let discardPile = [...deck.discardPile];
  const hand = [...deck.hand];
  let currentSeed = seed;

  for (let i = 0; i < n; i++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      const [reshuffled, nextSeed] = shuffle(discardPile, currentSeed);
      drawPile = reshuffled;
      discardPile = [];
      currentSeed = nextSeed;
    }
    const [card, ...rest] = drawPile;
    hand.push(card);
    drawPile = rest;
  }

  return [{ ...deck, drawPile, discardPile, hand }, currentSeed];
}

/** Moves every card in hand to the discard pile. */
export function discardHand(deck: Deck): Deck {
  return {
    ...deck,
    hand: [],
    discardPile: [...deck.discardPile, ...deck.hand],
  };
}

/** Removes the card at `index` from hand, sending it to the exhaust or discard pile. */
export function removeFromHand(
  deck: Deck,
  index: number,
  exhaust: boolean,
): Deck {
  const card = deck.hand[index];
  const hand = deck.hand.filter((_, i) => i !== index);
  if (exhaust) {
    return { ...deck, hand, exhaustPile: [...deck.exhaustPile, card] };
  }
  return { ...deck, hand, discardPile: [...deck.discardPile, card] };
}
