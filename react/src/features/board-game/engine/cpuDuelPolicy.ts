import { CARDS } from '@/features/board-game/data/cards';
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
 * A deterministic card-planning policy for the round about to start (a game
 * rule for the NPC side, like a Spire enemy script - not a board heuristic,
 * hence it lives in engine/, not ai/). The CPU's plan is a secret
 * commitment: fixed here, only revealed in `endDuelRound`. The user side
 * can use the same policy for autoplay/sims.
 *
 * Greedily picks cards allowed in this duel kind by value-per-energy,
 * preferring block over damage only when the OTHER side's last-round
 * revealed damage could KO `side`'s current poise again (otherwise damage
 * first). Ties break by hand order.
 *
 * Stays within `duel.energy`, not a fresh `ENERGY` budget: for the CPU this
 * is always the full budget (its plan is computed right after the round's
 * energy reset), but for the user some energy may already be spent on
 * queued cards, so this only plans what's still affordable right now.
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
  let energyLeft = duel.energy;
  for (const candidate of candidates) {
    if (candidate.cost > energyLeft) continue;
    plan.push(candidate.cardId);
    energyLeft -= candidate.cost;
  }
  return plan;
}

/** The CPU's own plan, per design doc §4: pure, deterministic, no RNG. */
export const planCpuCards = (state: GameState): string[] =>
  planCards(state, 'cpu');
