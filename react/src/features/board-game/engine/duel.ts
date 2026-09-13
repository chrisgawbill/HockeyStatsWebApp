import { ENERGY, MAX_ROUNDS } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import { discardHand, drawCards } from '@/features/board-game/engine/deck';
import { planCpuCards } from '@/features/board-game/engine/cpuDuelPolicy';
import {
  applyDamage,
  cardEffects,
  handSizeFor,
  makeDuelist,
  otherSide,
  removeIdsFromHand,
  ruleBlockReason,
  settleCards,
  totalCardEffects,
  type Side,
} from '@/features/board-game/engine/duelShared';
import { applyOutcome } from '@/features/board-game/engine/duelOutcome';
import type {
  CardBlockReason,
  Deck,
  DuelKind,
  DuelState,
  DuelOutcome,
  GameState,
  RevealResult,
} from '@/features/board-game/types/game';

/**
 * A stun lasts at most one turn for `team`. If stunned during its own turn,
 * it skips the rest of this turn and its next one; if stunned during the
 * opponent's turn, it skips its immediately upcoming turn.
 */
export function stunUntil(
  state: GameState,
  team: GameState['activeTeam'],
): number {
  return team === state.activeTeam ? state.turn + 2 : state.turn + 1;
}

/** Draws both sides' hands for a round and secretly plans the CPU's cards. */
function drawHandsAndPlan(state: GameState, duelBase: DuelState): GameState {
  const [deck, seed1] = drawCards(
    state.deck,
    handSizeFor(duelBase.kind),
    state.rngSeed,
  );
  const [cpuDeck, seed2] = drawCards(
    state.cpuDeck,
    handSizeFor(duelBase.kind),
    seed1,
  );
  const planningState: GameState = {
    ...state,
    deck,
    cpuDeck,
    rngSeed: seed2,
    duel: duelBase,
  };
  const cpuPlan = planCpuCards(planningState);
  return { ...planningState, duel: { ...duelBase, cpuPlan } };
}

/** Starts a duel: builds duelists, draws both opening hands, plans the CPU's round-1 cards, and clears `lastReveal`. */
export function createDuel(
  state: GameState,
  kind: DuelKind,
  attackerId: string,
  defenderId: string,
  receiverId: string | null = null,
): GameState {
  const attackerSkater = state.skaters.find((s) => s.id === attackerId)!;
  const defenderSkater = state.skaters.find((s) => s.id === defenderId)!;
  const userSide: Side =
    attackerSkater.team === 'user' ? 'attacker' : 'defender';

  const duelBase: DuelState = {
    kind,
    attacker: makeDuelist(state, attackerSkater),
    defender: makeDuelist(state, defenderSkater),
    userSide,
    round: 1,
    energy: ENERGY,
    cpuPlan: [],
    userQueue: [],
    receiverId,
  };

  return {
    ...drawHandsAndPlan({ ...state, lastReveal: null }, duelBase),
    phase: 'duel',
  };
}

/**
 * Why the hand card at `handIndex` can't be played right now, or null if it
 * can - the one legality path, for the UI to explain a greyed-out card.
 * Rule restrictions (permanent for this duel) are checked before energy
 * (which changes as cards are queued).
 */
export function cardBlockReason(
  state: GameState,
  handIndex: number,
): CardBlockReason | null {
  const duel = state.duel;
  if (!duel) return 'energy';
  const card = CARDS[state.deck.hand[handIndex]];
  if (!card) return 'energy';
  const reason = ruleBlockReason(duel, duel.userSide, card);
  if (reason) return reason;
  if (card.cost > duel.energy) return 'energy';
  return null;
}

/** True if the hand card at `handIndex` can be played: affordable and legal for the user's side right now. */
export function canPlayCard(state: GameState, handIndex: number): boolean {
  return cardBlockReason(state, handIndex) === null;
}

/**
 * Queues the user's hand card face-down: spends its energy, moves it from
 * hand to `userQueue`, and resolves only its `draw` effect now (drawing
 * isn't combat - block and damage wait for the simultaneous reveal).
 */
export function playCard(state: GameState, handIndex: number): GameState {
  if (!canPlayCard(state, handIndex)) return state;
  const duel = state.duel!;
  const cardId = state.deck.hand[handIndex];
  const card = CARDS[cardId];
  const userSkater = state.skaters.find(
    (s) => s.id === duel[duel.userSide].skaterId,
  )!;

  const hand = [...state.deck.hand];
  hand.splice(handIndex, 1);
  let deck: Deck = { ...state.deck, hand };
  let seed = state.rngSeed;

  const { draw } = cardEffects(card, userSkater.role);
  if (draw > 0) {
    const [drawnDeck, nextSeed] = drawCards(deck, draw, seed);
    deck = drawnDeck;
    seed = nextSeed;
  }

  const nextDuel: DuelState = {
    ...duel,
    energy: duel.energy - card.cost,
    userQueue: [...duel.userQueue, cardId],
  };
  return { ...state, deck, rngSeed: seed, duel: nextDuel };
}

/** Returns a queued card to the end of the user's hand and refunds its energy. Any draw it caused stays drawn. */
export function unqueueCard(state: GameState, queueIndex: number): GameState {
  const duel = state.duel;
  if (!duel) return state;
  const cardId = duel.userQueue[queueIndex];
  if (cardId === undefined) return state;
  const card = CARDS[cardId];

  const userQueue = duel.userQueue.filter((_, i) => i !== queueIndex);
  const deck: Deck = { ...state.deck, hand: [...state.deck.hand, cardId] };
  const nextDuel: DuelState = {
    ...duel,
    energy: duel.energy + card.cost,
    userQueue,
  };
  return { ...state, deck, duel: nextDuel };
}

/**
 * Ends the round with a simultaneous reveal: resets both blocks, applies
 * block then damage from both the user's queue and the CPU's secret plan,
 * settles played cards and discards both hands, records `lastReveal`, then
 * resolves a KO, a timeout, or continues into a freshly-planned round.
 */
export function endDuelRound(state: GameState): GameState {
  if (!state.duel) return state;
  const duel = state.duel;
  const userSide = duel.userSide;
  const cpuSide = otherSide(userSide);
  const userSkater = state.skaters.find(
    (s) => s.id === duel[userSide].skaterId,
  )!;
  const cpuSkater = state.skaters.find((s) => s.id === duel[cpuSide].skaterId)!;

  const userTotals = totalCardEffects(duel.userQueue, userSkater.role);
  const cpuTotals = totalCardEffects(duel.cpuPlan, cpuSkater.role);

  // The user's draw already resolved when each card was queued; only the CPU's is still pending.
  let cpuDeck = state.cpuDeck;
  let seed = state.rngSeed;
  if (cpuTotals.draw > 0) {
    const [drawnDeck, nextSeed] = drawCards(cpuDeck, cpuTotals.draw, seed);
    cpuDeck = drawnDeck;
    seed = nextSeed;
  }

  let userDuelist = { ...duel[userSide], block: userTotals.block };
  let cpuDuelist = { ...duel[cpuSide], block: cpuTotals.block };
  const userBlockBeforeDamage = userDuelist.block;
  const cpuBlockBeforeDamage = cpuDuelist.block;

  cpuDuelist = applyDamage(cpuDuelist, userTotals.damage);
  userDuelist = applyDamage(userDuelist, cpuTotals.damage);

  const userDamageDealt = Math.max(0, userTotals.damage - cpuBlockBeforeDamage);
  const cpuDamageDealt = Math.max(0, cpuTotals.damage - userBlockBeforeDamage);

  const userDeck = discardHand(settleCards(state.deck, duel.userQueue));
  cpuDeck = discardHand(
    settleCards(removeIdsFromHand(cpuDeck, duel.cpuPlan), duel.cpuPlan),
  );

  const reveal: RevealResult = {
    round: duel.round,
    userCards: duel.userQueue,
    cpuCards: duel.cpuPlan,
    userDamageDealt,
    cpuDamageDealt,
    userBlock: userTotals.block,
    cpuBlock: cpuTotals.block,
  };

  const roundDuel: DuelState = {
    ...duel,
    [userSide]: userDuelist,
    [cpuSide]: cpuDuelist,
    userQueue: [],
  } as DuelState;
  const roundState: GameState = {
    ...state,
    deck: userDeck,
    cpuDeck,
    rngSeed: seed,
    duel: roundDuel,
    lastReveal: reveal,
  };

  const userKo = userDuelist.poise <= 0;
  const cpuKo = cpuDuelist.poise <= 0;
  if (userKo && cpuKo) {
    const winner: Side =
      roundDuel.attacker.poise > roundDuel.defender.poise
        ? 'attacker'
        : 'defender';
    return resolveDuel(roundState, winner, true);
  }
  if (userKo) return resolveDuel(roundState, cpuSide, true);
  if (cpuKo) return resolveDuel(roundState, userSide, true);

  const nextRound = duel.round + 1;
  if (nextRound > MAX_ROUNDS) {
    const timeoutWinner: Side =
      duel.kind === 'faceoff'
        ? roundDuel.attacker.poise > roundDuel.defender.poise
          ? 'attacker'
          : 'defender'
        : 'defender';
    return resolveDuel(roundState, timeoutWinner, false);
  }

  const nextDuelBase: DuelState = {
    ...roundDuel,
    round: nextRound,
    energy: ENERGY,
  };
  return drawHandsAndPlan(roundState, nextDuelBase);
}

/** Resolves a finished duel: applies the §4 outcome table (puck, stun, goal), then clears the duel and both hands. */
export function resolveDuel(
  state: GameState,
  winner: Side,
  byKo: boolean,
): GameState {
  const duel = state.duel!;
  const { puck, stunSkaterId, goal, cleanSave } = applyOutcome(
    state,
    duel,
    winner,
  );

  let skaters = state.skaters;
  if (stunSkaterId) {
    const stunnedSkater = skaters.find((s) => s.id === stunSkaterId)!;
    const until = stunUntil(state, stunnedSkater.team);
    skaters = skaters.map((s) =>
      s.id === stunSkaterId ? { ...s, stunnedUntilTurn: until } : s,
    );
  }

  const winnerTeam = goal
    ? state.skaters.find((s) => s.id === duel.attacker.skaterId)!.team
    : null;
  const outcome: DuelOutcome = {
    kind: duel.kind,
    winner,
    byKo,
    attackerId: duel.attacker.skaterId,
    defenderId: duel.defender.skaterId,
    goal,
    cleanSave,
    summary: `${duel.kind} ${winner} wins${byKo ? ' by KO' : ' on timeout'}${goal ? ' - GOAL!' : ''}`,
    receiverId: duel.receiverId,
  };

  return {
    ...state,
    skaters,
    puck,
    deck: discardHand(state.deck),
    cpuDeck: discardHand(state.cpuDeck),
    duel: null,
    lastOutcome: outcome,
    phase: goal ? 'gameOver' : 'duelResult',
    winner: goal ? winnerTeam : state.winner,
  };
}
