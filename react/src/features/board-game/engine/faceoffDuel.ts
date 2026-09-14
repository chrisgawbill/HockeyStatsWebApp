/**
 * Faceoff minigame integration: wires `faceoffModel.ts` into the real game
 * as a two-sided ante pick plus a reaction roll (mirrors `shotDuel.ts`'s
 * shape). No user/CPU fork: both sides' bands come from the same
 * `rollBandFromAnticipation`, and the same contest function decides the
 * draw regardless of which side is human — the CPU just resolves its band
 * immediately since it has no UI to wait on.
 */
import { PERK_CENTER_FACEOFF_DRAW } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import { drawFilteredCards } from '@/features/board-game/engine/deck';
import { resolveDuel } from '@/features/board-game/engine/duel';
import {
  removeIdsFromHand,
  settleCards,
  type Side,
} from '@/features/board-game/engine/duelShared';
import {
  narrowedWindowsAfterJump,
  rollBandFromAnticipation,
  rollFaceoffHeadToHead,
  windowsForAnticipation,
} from '@/features/board-game/engine/faceoffModel';
import { nextFloat } from '@/features/board-game/engine/rng';
import type {
  Coord,
  Deck,
  DuelState,
  FaceoffBand,
  FaceoffBandWindows,
  FaceoffDuelResult,
  GameState,
} from '@/features/board-game/types/game';

/** Faceoff-pool ante size: 3 plus the C perk (`PERK_CENTER_FACEOFF_DRAW`) — draw 4, pick 1, not an extra dealt-hand card. */
export const FACEOFF_ANTE_SIZE = 3 + PERK_CENTER_FACEOFF_DRAW;

function isFaceoffCard(cardId: string): boolean {
  return CARDS[cardId]?.tags.includes('faceoff') ?? false;
}

/** Draws up to `FACEOFF_ANTE_SIZE` faceoff-pool cards into `deck.hand` as the ante offer. A short offer is possible (and fine) if the deck's faceoff cards are exhausted. */
function drawFaceoffOffer(deck: Deck, seed: number): [Deck, number] {
  return drawFilteredCards(deck, FACEOFF_ANTE_SIZE, seed, isFaceoffCard);
}

/**
 * "Go for it" ante policy (mirrors `pickBestShotCard`): picks the
 * highest-`anticipation` card offered. Used by the CPU centre, and reused
 * by `ai/autoplay.ts`'s headless sim to drive the user centre the same way.
 */
export function pickBestFaceoffCard(offer: string[]): string {
  return offer.reduce((best, id) =>
    (CARDS[id]?.anticipation ?? 0) > (CARDS[best]?.anticipation ?? 0)
      ? id
      : best,
  );
}

/**
 * Starts a faceoff: draws both centres' antes, and has the CPU centre pick
 * and settle its card immediately (only its *reaction* waits, rolled in
 * `resolveFaceoffBand` once the user's band is known). The user centre
 * waits in phase `'duel'` for `PICK_FACEOFF_CARD` then
 * `RESOLVE_FACEOFF_BAND` (or `AUTO_RESOLVE_FACEOFF`).
 *
 * @example
 * // Full user-side flow, in call order:
 * let state = createFaceoffDuel(gameState, userCId, cpuCId);
 * state = pickFaceoffCard(state, handIndex);   // ante the card
 * // ...UI times the drop, measures a reaction band...
 * state = resolveFaceoffBand(state, pickedCardId, band);
 */
export function createFaceoffDuel(
  state: GameState,
  attackerId: string,
  defenderId: string,
): GameState {
  const attackerSkater = state.skaters.find((s) => s.id === attackerId)!;
  const userSide: Side =
    attackerSkater.team === 'user' ? 'attacker' : 'defender';

  const [userOfferDeck, seed1] = drawFaceoffOffer(state.deck, state.rngSeed);
  const [cpuOfferDeck, seed2] = drawFaceoffOffer(state.cpuDeck, seed1);
  const cpuCardId =
    cpuOfferDeck.hand.length > 0
      ? pickBestFaceoffCard(cpuOfferDeck.hand)
      : null;
  const cpuDeck = cpuCardId
    ? settleCards(removeIdsFromHand(cpuOfferDeck, [cpuCardId]), [cpuCardId])
    : cpuOfferDeck;

  const duelBase: DuelState = {
    kind: 'faceoff',
    attacker: { skaterId: attackerId, poise: 0, maxPoise: 0, block: 0 },
    defender: { skaterId: defenderId, poise: 0, maxPoise: 0, block: 0 },
    userSide,
    round: 1,
    energy: 0,
    cpuPlan: [],
    userQueue: [],
    queueDraws: [],
    receiverId: null,
    shotPickedCardId: null,
    faceoffPickedCardId: null,
    faceoffCpuCardId: cpuCardId,
    faceoffJumped: false,
    faceoffResult: null,
  };

  return {
    ...state,
    deck: userOfferDeck,
    cpuDeck,
    rngSeed: seed2,
    duel: duelBase,
    lastReveal: null,
    phase: 'duel',
  };
}

/** True if `handIndex` is a legal ante pick right now: an active faceoff duel, no pick made yet, and a real hand card. */
export function canPickFaceoffCard(
  state: GameState,
  handIndex: number,
): boolean {
  const duel = state.duel;
  if (!duel || duel.kind !== 'faceoff' || duel.faceoffPickedCardId !== null)
    return false;
  return state.deck.hand[handIndex] !== undefined;
}

/** The user centre picks their ante card. The drop/reaction comes next in the UI; its band is reported via `resolveFaceoffBand`. */
export function pickFaceoffCard(
  state: GameState,
  handIndex: number,
): GameState {
  if (!canPickFaceoffCard(state, handIndex)) return state;
  const cardId = state.deck.hand[handIndex];
  return { ...state, duel: { ...state.duel!, faceoffPickedCardId: cardId } };
}

/**
 * Reaction windows for the user's picked card, for the UI to render
 * directly (never hardcode geometry). Narrowed after a first jump
 * (`narrowedWindowsAfterJump`) unless the card's effect is `freeJump`. Null
 * until a card is picked, or outside a faceoff duel.
 */
export function faceoffBandWindowsFor(
  state: GameState,
): FaceoffBandWindows | null {
  const duel = state.duel;
  if (!duel || duel.kind !== 'faceoff' || duel.faceoffPickedCardId === null)
    return null;
  const card = CARDS[duel.faceoffPickedCardId];
  if (!card) return null;
  const anticipation = card.anticipation ?? 0;
  if (duel.faceoffJumped && card.faceoffEffect !== 'freeJump') {
    return narrowedWindowsAfterJump(anticipation);
  }
  return windowsForAnticipation(anticipation);
}

/**
 * Resolves a faceoff once the user centre's band is known (a UI drop
 * reaction, or `autoResolveFaceoff`). Only the user can jump — the CPU's
 * band is never in question here. A first `jump` just marks the duel
 * jumped and waits for a retry (windows narrow via
 * `faceoffBandWindowsFor`); a SECOND jump forfeits the draw for the user
 * with no roll, though the CPU still gets its real band and its own
 * `clean`-win effect. Otherwise both bands go through the shared
 * `rollFaceoffHeadToHead`; a `scrumOnLoss` card can then downgrade its
 * bearer's loss into a scrum.
 */
export function resolveFaceoffBand(
  state: GameState,
  pickedCardId: string,
  band: FaceoffBand,
): GameState {
  const duel = state.duel!;

  if (band === 'jump' && !duel.faceoffJumped) {
    return {
      ...state,
      duel: {
        ...duel,
        faceoffPickedCardId: pickedCardId,
        faceoffJumped: true,
      },
    };
  }

  const userCard = CARDS[pickedCardId];
  const userGrip = userCard?.grip ?? 0;
  const cpuCardId = duel.faceoffCpuCardId;
  const cpuCard = cpuCardId ? CARDS[cpuCardId] : undefined;
  const cpuGrip = cpuCard?.grip ?? 0;
  const [cpuBand, seed1] = rollBandFromAnticipation(
    cpuCard?.anticipation ?? 0,
    state.rngSeed,
  );

  const forfeitedByJump = band === 'jump';
  let outcome: 'win' | 'loss' | 'scrum';
  let winChance = 0;
  let seed2 = seed1;

  if (forfeitedByJump) {
    outcome = 'loss';
  } else {
    const [contest, seed3] = rollFaceoffHeadToHead(
      band,
      userGrip,
      cpuBand,
      cpuGrip,
      seed1,
    );
    seed2 = seed3;
    winChance = contest.winChance;
    outcome =
      contest.outcome === 'scrum' ? 'scrum' : contest.userWins ? 'win' : 'loss';
  }

  // scrumOnLoss converts the LOSING side's own bearer's loss into a scrum —
  // checked after the roll/forfeit, symmetric either way.
  if (outcome === 'win' && cpuCard?.faceoffEffect === 'scrumOnLoss') {
    outcome = 'scrum';
  } else if (outcome === 'loss' && userCard?.faceoffEffect === 'scrumOnLoss') {
    outcome = 'scrum';
  }

  const result: FaceoffDuelResult = {
    userBand: forfeitedByJump ? 'jump' : band,
    cpuBand,
    outcome,
    winChance,
    forfeitedByJump,
  };

  const settledDeck = settleCards(
    removeIdsFromHand(state.deck, [pickedCardId]),
    [pickedCardId],
  );

  // Only for turn-order bookkeeping downstream (activeTeam after
  // DISMISS_DUEL_RESULT) — puck placement comes entirely from
  // `result.outcome` via `duel.faceoffResult` in duelOutcome.ts. A scrum has
  // no real winner, so this is an arbitrary but deterministic 'attacker'.
  const winner: Side = outcome === 'loss' ? 'defender' : 'attacker';

  const preResolve: GameState = {
    ...state,
    deck: settledDeck,
    rngSeed: seed2,
    lastFaceoffResult: result,
    duel: {
      ...duel,
      faceoffPickedCardId: pickedCardId,
      faceoffResult: result,
    },
  };

  return resolveDuel(preResolve, winner, false);
}

/**
 * Auto-resolves a faceoff without a real drop reaction: rolls a band from
 * the picked card's anticipation via `rollBandFromAnticipation` (never
 * `jump` — a false start is human-only), then finishes through
 * `resolveFaceoffBand`. Used for `prefers-reduced-motion` and the headless
 * sim, so the user centre is scored the same way as the CPU.
 */
export function autoResolveFaceoff(state: GameState): GameState {
  const duel = state.duel!;
  const pickedCardId = duel.faceoffPickedCardId!;
  const card = CARDS[pickedCardId];
  const [band, seed] = rollBandFromAnticipation(
    card?.anticipation ?? 0,
    state.rngSeed,
  );
  return resolveFaceoffBand({ ...state, rngSeed: seed }, pickedCardId, band);
}

/**
 * Nearer of a pair of defending dots to `shooterRow`, ties broken by a
 * seeded flip. `dots` is always the `[row 1, row 5]` pair from
 * `FACEOFF_SPOTS.defendingDots[team]`.
 */
export function pickDefendingDot(
  dots: Coord[],
  shooterRow: number,
  seed: number,
): [Coord, number] {
  const [a, b] = dots;
  const distanceA = Math.abs(a.row - shooterRow);
  const distanceB = Math.abs(b.row - shooterRow);
  if (distanceA < distanceB) return [a, seed];
  if (distanceB < distanceA) return [b, seed];
  const [t, nextSeed] = nextFloat(seed);
  return [t < 0.5 ? a : b, nextSeed];
}
