/**
 * Faceoff minigame integration (BG-A15b): wires BG-A15a's `faceoffModel.ts`
 * into the real game as a two-sided ante pick plus a reaction roll, fully
 * replacing the old faceoff card duel (Chris's call - no hybrid). Mirrors
 * `shotDuel.ts`'s shape: the reacting side draws a faceoff-pool ante via the
 * same `drawFilteredCards` BG-A13 built and either presses the drop
 * (`PICK_FACEOFF_CARD` then `RESOLVE_FACEOFF_BAND`) or auto-resolves
 * (`AUTO_RESOLVE_FACEOFF`). Unlike a shot's shooter/goalie split, both
 * centres in a faceoff are real card-playing duelists, so the CPU centre
 * also antes and reacts - through the identical `rollFaceoffContest` the
 * user's own draw resolves through - rather than sitting passive like a
 * shot's goalie. The CPU resolves immediately (it has no UI to wait on);
 * its result doesn't decide puck possession (the user's own roll does -
 * see `engine/duelOutcome.ts`'s `faceoff` case) but gates whether the CPU's
 * own card's `faceoffEffect` fires when it ends up with the puck.
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
  rollCpuFaceoffBand,
  rollFaceoffContest,
  windowsForAnticipation,
} from '@/features/board-game/engine/faceoffModel';
import { nextFloat } from '@/features/board-game/engine/rng';
import type {
  Coord,
  Deck,
  DuelState,
  FaceoffBand,
  FaceoffBandWindows,
  FaceoffContestResult,
  GameState,
} from '@/features/board-game/types/game';

/**
 * Faceoff-pool ante size: 3, plus the C perk (both duelists in a faceoff are
 * always C - `PERK_CENTER_FACEOFF_DRAW` now means draw 4, pick 1, not an
 * extra dealt-hand card; see the constant's own doc in `data/balance.ts`).
 */
export const FACEOFF_ANTE_SIZE = 3 + PERK_CENTER_FACEOFF_DRAW;

function isFaceoffCard(cardId: string): boolean {
  return CARDS[cardId]?.tags.includes('faceoff') ?? false;
}

/** Draws up to `FACEOFF_ANTE_SIZE` faceoff-pool cards into `deck.hand` as the ante offer. A short offer is possible (and fine) if the deck's faceoff cards are exhausted. */
function drawFaceoffOffer(deck: Deck, seed: number): [Deck, number] {
  return drawFilteredCards(deck, FACEOFF_ANTE_SIZE, seed, isFaceoffCard);
}

/**
 * "Go for it" ante policy, mirroring `pickBestShotCard`: picks the
 * highest-`anticipation` card offered (anticipation is the stat that
 * directly drives the reaction roll, so this is the aggressive pick). Used
 * by the CPU centre here, and reused by `ai/autoplay.ts`'s headless sim to
 * drive the user centre's ante the same way.
 */
export function pickBestFaceoffCard(offer: string[]): string {
  return offer.reduce((best, id) =>
    (CARDS[id]?.anticipation ?? 0) > (CARDS[best]?.anticipation ?? 0)
      ? id
      : best,
  );
}

/**
 * Starts a faceoff: draws both centres' antes and has the CPU centre pick
 * and settle its card immediately (it has no UI to wait on - only its
 * *reaction*, rolled once the user's own band is known in
 * `resolveFaceoffBand`, has to wait, since it needs the user's grip too). A
 * user centre waits in phase `'duel'` for `PICK_FACEOFF_CARD` then
 * `RESOLVE_FACEOFF_BAND` (or `AUTO_RESOLVE_FACEOFF`).
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
    faceoffUserResult: null,
    faceoffCpuResult: null,
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
 * The current faceoff's reaction windows for the user's picked card - the
 * contract BG-B25's UI renders directly, never hardcoding geometry. After a
 * first jump, the clean window is narrowed (`narrowedWindowsAfterJump`)
 * unless the picked card's effect is `freeJump`, which redrops at the full,
 * unpenalized `windowsForAnticipation` instead. Null until a card is
 * picked, or outside a faceoff duel.
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
 * Resolves a faceoff once the user centre's band is known (the UI's drop
 * reaction, or `autoResolveFaceoff`). Rolls the user's own
 * `rollFaceoffContest` first - the one roll that decides who gets the puck.
 * On a first `jump`, that's a re-drop: nothing resolves yet, just marks the
 * duel jumped and waits for another `RESOLVE_FACEOFF_BAND`/
 * `AUTO_RESOLVE_FACEOFF`. On a repeat jump or a real band, also rolls the
 * CPU centre's own independent `rollFaceoffContest` (driven by its anted
 * card's anticipation via `rollCpuFaceoffBand`, against the user's now-known
 * grip) - the same contest function for both sides, per Chris's ruling -
 * then settles the user's card and finishes through the existing
 * `resolveDuel`/`applyOutcome` outcome table.
 */
export function resolveFaceoffBand(
  state: GameState,
  pickedCardId: string,
  band: FaceoffBand,
): GameState {
  const duel = state.duel!;
  const userCard = CARDS[pickedCardId];
  const userGrip = userCard?.grip ?? 0;
  const cpuCardId = duel.faceoffCpuCardId;
  const cpuCard = cpuCardId ? CARDS[cpuCardId] : undefined;
  const cpuGrip = cpuCard?.grip ?? 0;

  const isRepeatJump = band === 'jump' && duel.faceoffJumped;
  const [userResult, seed1] = rollFaceoffContest(
    band,
    userGrip,
    cpuGrip,
    isRepeatJump,
    state.rngSeed,
  );

  if (userResult.reDrop) {
    return {
      ...state,
      rngSeed: seed1,
      duel: {
        ...duel,
        faceoffPickedCardId: pickedCardId,
        faceoffJumped: true,
      },
    };
  }

  let cpuResult: FaceoffContestResult | null = null;
  let seed2 = seed1;
  if (cpuCard) {
    const [cpuBand, seedA] = rollCpuFaceoffBand(
      cpuCard.anticipation ?? 0,
      seed2,
    );
    const [result, seedB] = rollFaceoffContest(
      cpuBand,
      cpuGrip,
      userGrip,
      false,
      seedA,
    );
    cpuResult = result;
    seed2 = seedB;
  }

  const settledDeck = settleCards(
    removeIdsFromHand(state.deck, [pickedCardId]),
    [pickedCardId],
  );

  const winner: Side = userResult.won ? 'attacker' : 'defender';

  const preResolve: GameState = {
    ...state,
    deck: settledDeck,
    rngSeed: seed2,
    lastFaceoffResult: userResult,
    duel: {
      ...duel,
      faceoffPickedCardId: pickedCardId,
      faceoffUserResult: userResult,
      faceoffCpuResult: cpuResult,
    },
  };

  return resolveDuel(preResolve, winner, false);
}

/**
 * Auto-resolves a faceoff without a real drop reaction: rolls a band
 * weighted by the picked card's anticipation, the same `rollBandFromAnticipation`
 * the reduced-motion/headless fallback uses (never `jump` - a false start
 * is human-only, exactly as `miss` is UI-only for shots), then finishes
 * through `resolveFaceoffBand` - one path, no second RNG source. For
 * BG-B25's `prefers-reduced-motion` fallback, and the headless BG-A10 sim
 * (see `ai/autoplay.ts`), so the user centre is measured the same way as
 * the CPU centre rather than by an unscored guess.
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
 * Which of a pair of defending dots (BG-A15b, needed by BG-A16's covered
 * puck too): the one nearest `shooterRow`, ties broken by a seeded flip -
 * rewards positioning rather than being arbitrary. `dots` is always the
 * `[row 1, row 5]` pair from `FACEOFF_SPOTS.defendingDots[team]`.
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
