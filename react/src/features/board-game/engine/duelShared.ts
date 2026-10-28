import {
  HAND_SIZE,
  PERK_DEFENSE_BONUS,
  SKATER_POISE,
} from '@/features/board-game/data/balance';
import { BASIC_ACTION_BY_SIDE, CARDS } from '@/features/board-game/data/cards';
import type {
  BattleSide,
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
 * Fresh duelist for `skater`: full skater poise, no block. Goalies never
 * pass through here — their poise lives on `GameState.goaliePoise` instead;
 * the shot duel builds its own duelist shapes.
 */
export function makeDuelist(skater: Skater): Duelist {
  return {
    skaterId: skater.id,
    poise: SKATER_POISE,
    maxPoise: SKATER_POISE,
    block: 0,
  };
}

/**
 * The battle side `side` plays in a duel of `kind`: the puck carrier is the
 * defender in a check (the attacker is the checker) and the attacker in
 * every other battle. Faceoff cards allow both sides, so the mapping is moot there.
 */
export function battleSideOf(kind: DuelKind, side: Side): BattleSide {
  const carrierSide: Side = kind === 'check' ? 'defender' : 'attacker';
  return side === carrierSide ? 'possession' : 'challenger';
}

/** The free basic action that pads `side`'s ordinary-battle offer. */
export function basicActionFor(kind: DuelKind, side: Side): string {
  return BASIC_ACTION_BY_SIDE[battleSideOf(kind, side)];
}

/** True for a padding basic action, which must never enter a deck pile. */
export function isBasicAction(cardId: string): boolean {
  return Object.values(BASIC_ACTION_BY_SIDE).includes(cardId);
}

/**
 * Cards offered each round of this duel kind. Never called with `kind ===
 * 'faceoff'` — faceoffs resolve through `engine/faceoffDuel.ts`'s ante instead.
 */
export function handSizeFor(_kind: DuelKind): number {
  return HAND_SIZE;
}

/**
 * Bonus a position perk adds to a card's damage/block effect. Shot cards
 * never reach this — the shot ante scores on accuracy/power directly; see
 * `shotAccuracyBonus` in engine/shotModel.ts for that bonus instead.
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

/** True if `side` may play `card` in this duel — the one legality path `canPlayCard`/`planCards` both use. */
export function isCardAllowedFor(
  duel: DuelState,
  side: Side,
  card: CardDef,
): boolean {
  return ruleBlockReason(duel, side, card) === null;
}

/**
 * The reason a card is blocked in a duel kind its `allowedIn` omits: its
 * single pool (shot or faceoff) when it has one, else just another battle.
 */
function otherContextReason(card: CardDef): CardBlockReason {
  const kinds = Object.keys(card.allowedIn);
  if (kinds.length === 1 && kinds[0] === 'shot') return 'shotOnly';
  if (kinds.length === 1 && kinds[0] === 'faceoff') return 'faceoffOnly';
  return 'otherBattle';
}

/**
 * Why the game's rules (not energy) forbid `side` from playing `card` in
 * this duel, or null if allowed — the one rule-legality path drawing,
 * `isCardAllowedFor` and `cardBlockReason` build on. A card is legal only
 * when its `allowedIn` lists this duel kind with `side`'s battle side.
 * Checked ahead of energy since these restrictions are permanent for the duel.
 */
export function ruleBlockReason(
  duel: DuelState,
  side: Side,
  card: CardDef,
): CardBlockReason | null {
  const allowedSides = card.allowedIn[duel.kind];
  if (!allowedSides) return otherContextReason(card);
  return allowedSides.includes(battleSideOf(duel.kind, side))
    ? null
    : 'otherSide';
}

/**
 * True if `cardId` may be drawn into `side`'s hand: rule-legal per
 * `ruleBlockReason`, ignoring energy. Filters each round's offer and
 * mid-round draw effects so no dead-for-this-duel card ever reaches hand. Never called
 * with `duel.kind === 'shot'` — shot duels don't draw a card-duel hand at all.
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

/** Moves each of `cardIds` (already out of hand) to exhaust or discard; basic actions simply vanish. */
export function settleCards(deck: Deck, cardIds: string[]): Deck {
  const discardPile = [...deck.discardPile];
  const exhaustPile = [...deck.exhaustPile];
  for (const id of cardIds) {
    if (isBasicAction(id)) continue;
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
