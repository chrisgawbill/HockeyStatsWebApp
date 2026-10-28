import { CARDS } from '@/features/board-game/data/cards';
import { ENERGY } from '@/features/board-game/data/balance';
import {
  cardEffects,
  isCardAllowedFor,
  otherSide,
} from '@/features/board-game/engine/duelShared';
import type {
  CardDef,
  GameState,
  Role,
} from '@/features/board-game/types/game';

/** Combat value of a card for `role`: its (perked) damage plus its (perked) block. Draw effects add none. */
function cardValue(card: CardDef, role: Role): number {
  const { damage, block } = cardEffects(card, role);
  return damage + block;
}

function cardCategory(card: CardDef): 'block' | 'damage' | 'other' {
  if (card.effects.some((e) => e.type === 'block')) return 'block';
  if (card.effects.some((e) => e.type === 'damage')) return 'damage';
  return 'other';
}

/**
 * Deterministic card-planning policy for the round about to start — a game
 * rule for the CPU side (like a Spire enemy script), not a board heuristic,
 * hence engine/ not ai/. The CPU's plan is a secret commitment: fixed here,
 * revealed only in `endDuelRound`. The user side can reuse it for autoplay/sims.
 *
 * Greedily picks allowed cards by value-per-energy, preferring block over
 * damage only when the other side's last-round damage could KO `side`
 * again; ties break by hand order.
 *
 * The user spends against `duel.energy`, which may include a daily-streak
 * bonus or already-committed queued cards. The CPU always plans against the
 * base `ENERGY` budget; the streak bonus is user-only.
 */
export function planCards(state: GameState, side: 'user' | 'cpu'): string[] {
  const duel = state.duel;
  if (!duel) return [];
  const targetSide = side === 'user' ? duel.userSide : otherSide(duel.userSide);
  const skater = state.skaters.find((s) => s.id === duel[targetSide].skaterId)!;
  const deck = side === 'user' ? state.deck : state.cpuDeck;
  const damageTakenLastRound =
    side === 'user'
      ? (state.lastReveal?.cpuDamageDealt ?? 0)
      : (state.lastReveal?.userDamageDealt ?? 0);
  const preferBlock = damageTakenLastRound >= duel[targetSide].poise;

  const candidates = deck.hand
    .map((cardId, index) => ({ cardId, index, card: CARDS[cardId] }))
    .filter(({ card }) => card && isCardAllowedFor(duel, targetSide, card))
    .map(({ cardId, index, card }) => ({
      cardId,
      index,
      category: cardCategory(card),
      valuePerEnergy: cardValue(card, skater.role) / card.cost,
      cost: card.cost,
    }));

  candidates.sort((a, b) => {
    const preferred = preferBlock ? 'block' : 'damage';
    const aPreferred =
      a.category === preferred ? 0 : a.category === 'other' ? 2 : 1;
    const bPreferred =
      b.category === preferred ? 0 : b.category === 'other' ? 2 : 1;
    return (
      aPreferred - bPreferred ||
      b.valuePerEnergy - a.valuePerEnergy ||
      a.index - b.index
    );
  });

  const plan: string[] = [];
  let energyLeft = side === 'cpu' ? ENERGY : duel.energy;
  for (const candidate of candidates) {
    if (candidate.cost > energyLeft) continue;
    plan.push(candidate.cardId);
    energyLeft -= candidate.cost;
  }
  return plan;
}

/** Pure, deterministic CPU plan with no RNG. */
export const planCpuCards = (state: GameState): string[] =>
  planCards(state, 'cpu');

/** Broad, honest read on how much of its round the CPU committed, shown before the reveal. */
export type CpuIntent =
  'Conservative' | 'Balanced' | 'Aggressive' | 'Heavy Commitment';

/**
 * The CPU's intent for a planned round, from the share of its base `ENERGY`
 * the plan spends: up to 25% Conservative, up to 50% Balanced, under 75%
 * Aggressive, else Heavy Commitment. Reveals neither card names nor count.
 */
export function describeCpuIntent(cpuPlan: string[]): CpuIntent {
  const committedEnergy = cpuPlan.reduce(
    (total, id) => total + (CARDS[id]?.cost ?? 0),
    0,
  );
  const committedShare = committedEnergy / ENERGY;
  if (committedShare <= 0.25) return 'Conservative';
  if (committedShare <= 0.5) return 'Balanced';
  if (committedShare < 0.75) return 'Aggressive';
  return 'Heavy Commitment';
}
