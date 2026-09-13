import {
  GOALIE_POISE_BY_LENGTH,
  HAND_SIZE,
  PERK_CENTER_FACEOFF_DRAW,
  PERK_DEFENSE_BONUS,
  PERK_WING_SHOT_BONUS,
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
  GameState,
  Role,
  Skater,
} from '@/features/board-game/types/game';

/** Which physical side of a `DuelState` a duelist occupies. */
export type Side = 'attacker' | 'defender';

export function otherSide(side: Side): Side {
  return side === 'attacker' ? 'defender' : 'attacker';
}

/** A fresh duelist for `skater`: full poise (goalie poise depends on `state.length`), no block. */
export function makeDuelist(state: GameState, skater: Skater): Duelist {
  const poise =
    skater.role === 'G' ? GOALIE_POISE_BY_LENGTH[state.length] : SKATER_POISE;
  return { skaterId: skater.id, poise, maxPoise: poise, block: 0 };
}

/** Hand size for a round of this duel kind: +1 for the C-in-faceoff perk (both duelists in a faceoff are always C). */
export function handSizeFor(kind: DuelKind): number {
  return HAND_SIZE + (kind === 'faceoff' ? PERK_CENTER_FACEOFF_DRAW : 0);
}

/** Bonus amount a position perk adds to a card's damage or block effect. */
export function perkBonus(
  role: Role,
  tags: CardTag[],
  kind: 'damage' | 'block',
): number {
  if (
    kind === 'damage' &&
    (role === 'LW' || role === 'RW') &&
    tags.includes('shot')
  ) {
    return PERK_WING_SHOT_BONUS;
  }
  if (
    (role === 'LD' || role === 'RD') &&
    (tags.includes('check') || tags.includes('block'))
  ) {
    return PERK_DEFENSE_BONUS;
  }
  return 0;
}

/**
 * True if `side` may play `card` in this duel: `allowedIn` passes, and - in
 * a shot duel - the goalie side may only play block-effect cards. A shot
 * duel is always created carrier-as-attacker, goalie-as-defender (see
 * `handleShoot`), so "the goalie side" is simply `defender` here; no skater
 * lookup needed. The one legality path `canPlayCard` and `planCards` both use.
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
 */
export function ruleBlockReason(
  duel: DuelState,
  side: Side,
  card: CardDef,
): CardBlockReason | null {
  // A shot duel is always created carrier-as-attacker, goalie-as-defender
  // (see `handleShoot`), so "the goalie side" is simply `defender` here; no
  // skater/role lookup needed.
  if (
    duel.kind === 'shot' &&
    side === 'defender' &&
    !card.effects.some((e) => e.type === 'block')
  ) {
    return 'goalieBlockOnly';
  }
  if (card.allowedIn === 'any' || card.allowedIn.includes(duel.kind))
    return null;
  const firstKind = card.allowedIn[0];
  if (firstKind === 'shot') return 'shotOnly';
  if (firstKind === 'check') return 'checkOnly';
  return null;
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
