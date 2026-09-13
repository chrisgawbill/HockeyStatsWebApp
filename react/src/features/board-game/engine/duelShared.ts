import {
  HAND_SIZE,
  PERK_CENTER_FACEOFF_DRAW,
  PERK_DEFENSE_BONUS,
  SKATER_POISE,
} from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import type {
  CardBlockReason,
  CardDef,
  CardTag,
  Deck,
  DuelKind,
  DuelState,
  Duelist,
  Role,
  Skater,
} from '@/features/board-game/types/game';

/** Which physical side of a `DuelState` a duelist occupies. */
export type Side = 'attacker' | 'defender';

export function otherSide(side: Side): Side {
  return side === 'attacker' ? 'defender' : 'attacker';
}

/**
 * A fresh duelist for `skater`: full skater poise, no block. Goalies never
 * pass through here (BG-A14b moved goalie poise to `GameState.goaliePoise`,
 * persisted across the match) - the shot duel builds its own duelist shapes
 * in `engine/shotDuel.ts`.
 */
export function makeDuelist(skater: Skater): Duelist {
  return {
    skaterId: skater.id,
    poise: SKATER_POISE,
    maxPoise: SKATER_POISE,
    block: 0,
  };
}

/** Hand size for a round of this duel kind: +1 for the C-in-faceoff perk (both duelists in a faceoff are always C). */
export function handSizeFor(kind: DuelKind): number {
  return HAND_SIZE + (kind === 'faceoff' ? PERK_CENTER_FACEOFF_DRAW : 0);
}

/**
 * Bonus amount a position perk adds to a card's damage or block effect.
 * BG-A14b: the LW/RW wing perk no longer lives here - shot cards never
 * reach `cardEffects`/`perkBonus` any more (the shot ante scores on
 * accuracy/power directly, not card effects), so its wing bonus is now
 * `shotAccuracyBonus` in `engine/shotModel.ts` instead.
 */
export function perkBonus(
  role: Role,
  tags: CardTag[],
  _kind: 'damage' | 'block',
): number {
  if (
    (role === 'LD' || role === 'RD') &&
    (tags.includes('check') || tags.includes('block'))
  ) {
    return PERK_DEFENSE_BONUS;
  }
  return 0;
}

/**
 * True if `side` may play `card` in this duel: `allowedIn` passes. The one
 * legality path `canPlayCard` and `planCards` both use.
 */
export function isCardAllowedFor(
  duel: DuelState,
  side: Side,
  card: CardDef,
): boolean {
  return ruleBlockReason(duel, side, card) === null;
}

/**
 * Why the game's rules (not energy) forbid `side` from playing `card` in
 * this duel, or null if the rules allow it. The one rule-legality path
 * `isCardAllowedFor` and `cardBlockReason` both build on - checked ahead of
 * energy since these restrictions are permanent for the duel, unlike energy.
 *
 * Shot duels never reach this function any more (BG-A14b: the shot minigame
 * is an ante pick, not a card duel - see `engine/shotDuel.ts`), so there is
 * no goalie-side special case here.
 */
export function ruleBlockReason(
  duel: DuelState,
  _side: Side,
  card: CardDef,
): CardBlockReason | null {
  if (card.allowedIn === 'any' || card.allowedIn.includes(duel.kind))
    return null;
  const firstKind = card.allowedIn[0];
  if (firstKind === 'shot') return 'shotOnly';
  if (firstKind === 'check') return 'checkOnly';
  return null;
}

/**
 * True if `cardId` may be drawn into `side`'s hand for this duel: rule-legal
 * per `ruleBlockReason`, ignoring energy (energy only greys a card already
 * in hand). Used to filter the initial and per-round hand draws so no
 * dead-for-this-duel card ever reaches hand (BG-A13).
 *
 * BG-A14b removed the shot-duel exemption this used to carry: shot duels no
 * longer draw a card-duel hand at all (see `engine/shotDuel.ts`'s own
 * shot-pool filter), so this is never called with `duel.kind === 'shot'`.
 */
export function isDrawEligibleCard(
  duel: DuelState,
  side: Side,
  cardId: string,
): boolean {
  const card = CARDS[cardId];
  if (!card) return false;
  return ruleBlockReason(duel, side, card) === null;
}

/** Applies damage to a duelist: block absorbs first, the remainder hits poise. */
export function applyDamage(target: Duelist, amount: number): Duelist {
  const absorbed = Math.min(target.block, amount);
  const remaining = amount - absorbed;
  return {
    ...target,
    block: target.block - absorbed,
    poise: target.poise - remaining,
  };
}

/** A card's total damage/block/draw for `role`, perks included. The one effect-math path every caller composes from. */
export function cardEffects(
  card: CardDef,
  role: Role,
): { damage: number; block: number; draw: number } {
  let damage = 0;
  let block = 0;
  let draw = 0;
  for (const effect of card.effects) {
    if (effect.type === 'damage')
      damage += effect.amount + perkBonus(role, card.tags, 'damage');
    else if (effect.type === 'block')
      block += effect.amount + perkBonus(role, card.tags, 'block');
    else if (effect.type === 'draw') draw += effect.amount;
  }
  return { damage, block, draw };
}

/** Sums `cardEffects` over several cards (e.g. a whole queue or plan). Unknown ids are skipped. */
export function totalCardEffects(
  cardIds: string[],
  role: Role,
): { damage: number; block: number; draw: number } {
  return cardIds.reduce(
    (totals, id) => {
      const card = CARDS[id];
      if (!card) return totals;
      const e = cardEffects(card, role);
      return {
        damage: totals.damage + e.damage,
        block: totals.block + e.block,
        draw: totals.draw + e.draw,
      };
    },
    { damage: 0, block: 0, draw: 0 },
  );
}

/** Moves each of `cardIds` (already out of hand) to exhaust or discard. */
export function settleCards(deck: Deck, cardIds: string[]): Deck {
  const discardPile = [...deck.discardPile];
  const exhaustPile = [...deck.exhaustPile];
  for (const id of cardIds) {
    if (CARDS[id]?.exhaust) exhaustPile.push(id);
    else discardPile.push(id);
  }
  return { ...deck, discardPile, exhaustPile };
}

/** Removes each of `cardIds` from `deck.hand` (first occurrence each), so they can be settled separately. */
export function removeIdsFromHand(deck: Deck, cardIds: string[]): Deck {
  const hand = [...deck.hand];
  for (const id of cardIds) {
    const index = hand.indexOf(id);
    if (index !== -1) hand.splice(index, 1);
  }
  return { ...deck, hand };
}
