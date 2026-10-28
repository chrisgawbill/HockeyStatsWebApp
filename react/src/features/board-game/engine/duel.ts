import { ENERGY, MAX_ROUNDS } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import {
  discardHand,
  drawFilteredCards,
  drawPaddedOffer,
  returnCardsToDeck,
} from '@/features/board-game/engine/deck';
import { planCpuCards } from '@/features/board-game/engine/cpuDuelPolicy';
import {
  applyDamage,
  basicActionFor,
  cardEffects,
  handSizeFor,
  isDrawEligibleCard,
  makeDuelist,
  otherSide,
  removeIdsFromHand,
  ruleBlockReason,
  settleCards,
  standingResistance,
  totalCardEffects,
  type Side,
} from '@/features/board-game/engine/duelShared';
import { applyOutcome } from '@/features/board-game/engine/duelOutcome';
import { expireInvalidScreen } from '@/features/board-game/engine/selectors';
import type {
  CardBlockReason,
  Deck,
  DuelKind,
  DuelState,
  DuelOutcome,
  GameState,
  RevealResult,
} from '@/features/board-game/types/game';

/** Draws `side`'s round offer: a full hand of cards legal for its side of this battle, padded with its basic action when too few remain. */
function drawRoundOffer(
  deck: Deck,
  seed: number,
  duel: DuelState,
  side: Side,
): [Deck, number] {
  return drawPaddedOffer(
    deck,
    handSizeFor(duel.kind),
    seed,
    (cardId) => isDrawEligibleCard(duel, side, cardId),
    basicActionFor(duel.kind, side),
  );
}

/** Resolves a mid-round draw effect for `side`: only cards legal for its side of this battle, never padded. */
function drawEligibleCards(
  deck: Deck,
  count: number,
  seed: number,
  duel: DuelState,
  side: Side,
): [Deck, number] {
  return drawFilteredCards(deck, count, seed, (cardId) =>
    isDrawEligibleCard(duel, side, cardId),
  );
}

/**
 * Draws both sides' round offers and secretly plans the CPU's cards. Both
 * offers follow the same side-aware filter and padding rules, so a card
 * never sits in hand dead-on-arrival; ineligible cards stay in the deck.
 */
function drawHandsAndPlan(state: GameState, duelBase: DuelState): GameState {
  const cpuSide = otherSide(duelBase.userSide);
  const [deck, seed1] = drawRoundOffer(
    state.deck,
    state.rngSeed,
    duelBase,
    duelBase.userSide,
  );
  const [cpuDeck, seed2] = drawRoundOffer(
    state.cpuDeck,
    seed1,
    duelBase,
    cpuSide,
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
    attacker: makeDuelist(attackerSkater),
    defender: makeDuelist(defenderSkater),
    userSide,
    round: 1,
    energy: ENERGY + state.bonusEnergy,
    cpuPlan: [],
    userQueue: [],
    queueDraws: [],
    receiverId,
    shotPickedCardId: null,
    faceoffPickedCardId: null,
    faceoffCpuCardId: null,
    faceoffJumped: false,
    faceoffResult: null,
  };

  return {
    ...drawHandsAndPlan({ ...state, lastReveal: null }, duelBase),
    phase: 'duel',
  };
}

/**
 * Why the hand card at `handIndex` can't be played, or null if it can — the
 * one legality path, for the UI to explain a greyed-out card. Rule
 * restrictions (permanent) are checked before energy (which changes as cards queue).
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
 * hand to `userQueue`, and resolves only its `draw` effect now — block and
 * damage wait for the simultaneous reveal.
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

  const handBeforeDraw = deck.hand;
  const { draw } = cardEffects(card, userSkater.role);
  let drawnIds: string[] = [];
  if (draw > 0) {
    const [drawnDeck, nextSeed] = drawEligibleCards(
      deck,
      draw,
      seed,
      duel,
      duel.userSide,
    );
    drawnIds = drawnDeck.hand.slice(handBeforeDraw.length);
    deck = drawnDeck;
    seed = nextSeed;
  }

  const nextDuel: DuelState = {
    ...duel,
    energy: duel.energy - card.cost,
    userQueue: [...duel.userQueue, cardId],
    queueDraws: [...duel.queueDraws, drawnIds],
  };
  return { ...state, deck, rngSeed: seed, duel: nextDuel };
}

/** True if the queued card at `queueIndex` can be unqueued: every card it drew is still sitting in hand (none has since been queued itself). */
export function canUnqueueCard(state: GameState, queueIndex: number): boolean {
  const duel = state.duel;
  if (!duel) return false;
  if (duel.userQueue[queueIndex] === undefined) return false;
  const drawnIds = duel.queueDraws[queueIndex] ?? [];
  return drawnIds.every((id) => state.deck.hand.includes(id));
}

/**
 * Returns a queued card to the end of hand and refunds its energy. Any
 * cards it drew are pulled back out and shuffled into the draw pile, so
 * unqueuing can't be used to peek at the next card. Refused (state
 * unchanged) if a drawn card has since been queued itself.
 */
export function unqueueCard(state: GameState, queueIndex: number): GameState {
  const duel = state.duel;
  if (!duel) return state;
  const cardId = duel.userQueue[queueIndex];
  if (cardId === undefined) return state;
  if (!canUnqueueCard(state, queueIndex)) return state;
  const card = CARDS[cardId];
  const drawnIds = duel.queueDraws[queueIndex] ?? [];

  const userQueue = duel.userQueue.filter((_, i) => i !== queueIndex);
  const queueDraws = duel.queueDraws.filter((_, i) => i !== queueIndex);
  let deck: Deck = { ...state.deck, hand: [...state.deck.hand, cardId] };
  let seed = state.rngSeed;
  if (drawnIds.length > 0) {
    const [returnedDeck, nextSeed] = returnCardsToDeck(deck, drawnIds, seed);
    deck = returnedDeck;
    seed = nextSeed;
  }
  const nextDuel: DuelState = {
    ...duel,
    energy: duel.energy + card.cost,
    userQueue,
    queueDraws,
  };
  return { ...state, deck, rngSeed: seed, duel: nextDuel };
}

/**
 * Ends the round with a simultaneous reveal: resets both blocks, applies
 * block (zeroed by an opposing breaks-resistance card) then damage from both queues, settles and discards both hands,
 * records `lastReveal`, then resolves a KO, a timeout, or the next round.
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
    const [drawnDeck, nextSeed] = drawEligibleCards(
      cpuDeck,
      cpuTotals.draw,
      seed,
      duel,
      cpuSide,
    );
    cpuDeck = drawnDeck;
    seed = nextSeed;
  }

  const userBlockBeforeDamage = standingResistance(userTotals, cpuTotals);
  const cpuBlockBeforeDamage = standingResistance(cpuTotals, userTotals);
  let userDuelist = { ...duel[userSide], block: userBlockBeforeDamage };
  let cpuDuelist = { ...duel[cpuSide], block: cpuBlockBeforeDamage };

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
    userBlock: userBlockBeforeDamage,
    cpuBlock: cpuBlockBeforeDamage,
    userBrokeResistance: userTotals.breaksResistance,
    cpuBrokeResistance: cpuTotals.breaksResistance,
  };

  const roundDuel: DuelState = {
    ...duel,
    [userSide]: userDuelist,
    [cpuSide]: cpuDuelist,
    userQueue: [],
    queueDraws: [],
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
    // Faceoff duels resolve through `engine/faceoffDuel.ts`'s ante+reaction
    // instead and never reach this timeout path. Every kind that does
    // (deke/check/intercept) favors the defender on a timeout.
    return resolveDuel(roundState, 'defender', false);
  }

  const nextDuelBase: DuelState = {
    ...roundDuel,
    round: nextRound,
    energy: ENERGY + state.bonusEnergy,
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
  const { puck, stunSkaterId, goal, cleanSave, rngSeed, bonusSteps } =
    applyOutcome(state, duel, winner);

  const skaters = stunSkaterId
    ? state.skaters.map((s) =>
        s.id === stunSkaterId ? { ...s, stunned: true } : s,
      )
    : state.skaters;

  const winnerTeam = goal
    ? state.skaters.find((s) => s.id === duel.attacker.skaterId)!.team
    : null;
  const screenState = expireInvalidScreen({
    ...state,
    puck,
    screen:
      goal ||
      state.lastShotSaveResult?.covered ||
      state.lastShotSaveResult?.freeze ||
      (duel.kind === 'netFront' && winner === 'attacker')
        ? null
        : state.screen,
  });
  const outcome: DuelOutcome = {
    kind: duel.kind,
    winner,
    byKo,
    attackerId: duel.attacker.skaterId,
    defenderId: duel.defender.skaterId,
    goal,
    cleanSave,
    summary:
      duel.kind === 'netFront'
        ? `${winner === 'attacker' ? 'Defenseman clears the crease' : 'Screener holds position'}${byKo ? ' by KO' : ' on timeout'}`
        : `${duel.kind} ${winner} wins${byKo ? ' by KO' : ' on timeout'}${goal ? ' - GOAL!' : ''}`,
    receiverId: duel.receiverId,
  };

  return {
    ...state,
    screen: screenState.screen,
    skaters,
    puck,
    rngSeed,
    pendingBonusSteps: bonusSteps,
    deck: discardHand(state.deck),
    cpuDeck: discardHand(state.cpuDeck),
    duel: null,
    lastOutcome: outcome,
    phase: goal ? 'gameOver' : 'duelResult',
    winner: goal ? winnerTeam : state.winner,
  };
}
