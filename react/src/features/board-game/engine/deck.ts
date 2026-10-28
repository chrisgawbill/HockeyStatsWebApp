import {
  isBasicAction,
  removeIdsFromHand,
} from '@/features/board-game/engine/duelShared';
import { shuffle } from '@/features/board-game/engine/rng';
import type { Deck } from '@/features/board-game/types/game';

/** Builds a fresh deck with `ids` shuffled into the draw pile. */
export function createDeck(ids: string[], seed: number): [Deck, number] {
  const [drawPile, nextSeed] = shuffle(ids, seed);
  return [{ drawPile, hand: [], discardPile: [], exhaustPile: [] }, nextSeed];
}

/**
 * Draws up to `n` cards matching `isEligible` into the hand, skipping over
 * ineligible cards left in place in the pile. Reshuffles the discard pile in
 * when the draw pile runs dry of eligible cards. Stops early (a short hand)
 * once the eligible pool can't fill `n` - never loops forever, and never
 * drops an ineligible card from the deck.
 */
export function drawFilteredCards(
  deck: Deck,
  n: number,
  seed: number,
  isEligible: (cardId: string) => boolean,
): [Deck, number] {
  let drawPile = [...deck.drawPile];
  let discardPile = [...deck.discardPile];
  const hand = [...deck.hand];
  let currentSeed = seed;
  let drawn = 0;

  while (drawn < n) {
    const index = drawPile.findIndex(isEligible);
    if (index === -1) {
      if (discardPile.length === 0) break;
      const [reshuffled, nextSeed] = shuffle(
        [...drawPile, ...discardPile],
        currentSeed,
      );
      drawPile = reshuffled;
      discardPile = [];
      currentSeed = nextSeed;
      if (!drawPile.some(isEligible)) break;
      continue;
    }
    const [card] = drawPile.splice(index, 1);
    hand.push(card);
    drawn++;
  }

  return [{ ...deck, drawPile, discardPile, hand }, currentSeed];
}

/**
 * Draws an ordinary battle offer of exactly `size` cards: up to `size`
 * eligible cards (see `drawFilteredCards`), with every slot the eligible
 * pool can't fill padded by `basicActionId`. Padding is created for this
 * offer only and is stripped again when the hand is settled or discarded.
 */
export function drawPaddedOffer(
  deck: Deck,
  size: number,
  seed: number,
  isEligible: (cardId: string) => boolean,
  basicActionId: string,
): [Deck, number] {
  const [drawnDeck, nextSeed] = drawFilteredCards(deck, size, seed, isEligible);
  const drawnCount = drawnDeck.hand.length - deck.hand.length;
  const padding = Array.from(
    { length: size - drawnCount },
    () => basicActionId,
  );
  return [{ ...drawnDeck, hand: [...drawnDeck.hand, ...padding] }, nextSeed];
}

/** Moves the whole hand to the discard pile; basic actions are dropped instead. */
export function discardHand(deck: Deck): Deck {
  const deckCards = deck.hand.filter((id) => !isBasicAction(id));
  return {
    ...deck,
    hand: [],
    discardPile: [...deck.discardPile, ...deckCards],
  };
}

/**
 * Removes `ids` from hand and shuffles them back into the draw pile, so an
 * unqueue can't be used to peek at the next card. Basic actions never
 * enter the draw pile.
 */
export function returnCardsToDeck(
  deck: Deck,
  ids: string[],
  seed: number,
): [Deck, number] {
  const { hand } = removeIdsFromHand(deck, ids);
  const deckCards = ids.filter((id) => !isBasicAction(id));
  const [drawPile, nextSeed] = shuffle([...deck.drawPile, ...deckCards], seed);
  return [{ ...deck, hand, drawPile }, nextSeed];
}

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
