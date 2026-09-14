/**
 * Faceoff minigame integration: wires `faceoffModel.ts` into the real game
 * as a two-sided ante pick plus a reaction roll. Mirrors `shotDuel.ts`'s
 * shape: a centre draws a faceoff-pool ante via `drawFilteredCards` and
 * either presses the drop (`PICK_FACEOFF_CARD` then `RESOLVE_FACEOFF_BAND`)
 * or auto-resolves (`AUTO_RESOLVE_FACEOFF`).
 *
 * There is no user/CPU fork anywhere in the resolution: the CPU's band
 * comes from the exact same `rollBandFromAnticipation` a human's
 * reduced-motion/headless fallback uses, on its own anted card's
 * `anticipation`, and the exact same contest function decides the draw
 * regardless of which side is human. The CPU still resolves its own band
 * immediately (it has no UI to wait on) rather than genuinely reacting in
 * real time, but that's a timing/input detail, not a privileged resolution
 * path.
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

/**
 * Faceoff-pool ante size: 3, plus the C perk (both duelists in a faceoff
 * are always C - `PERK_CENTER_FACEOFF_DRAW` means draw 4, pick 1, not an
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
 * The current faceoff's reaction windows for the user's picked card - the
 * contract the UI renders directly, never hardcoding geometry. After a
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
 * reaction, or `autoResolveFaceoff`).
 *
 * Jump/re-drop is per-side, and only the user can jump at all (a jump is a
 * genuine false start - `rollBandFromAnticipation` never produces one, so
 * the CPU's own band is never in question here): on the user's FIRST
 * `jump` this duel, nothing resolves yet - just marks the duel jumped
 * (`faceoffBandWindowsFor` narrows the retry's clean window, unless the
 * picked card's effect is `freeJump`) and waits for another
 * `RESOLVE_FACEOFF_BAND`/`AUTO_RESOLVE_FACEOFF`. A SECOND `jump` forfeits
 * the draw outright for the user - no roll is made for them, though the
 * CPU still gets its own real band and can still fire its own card's
 * effect if that band was `clean`.
 *
 * Otherwise, both centres' bands are real: the CPU's is rolled fresh here
 * (its own anted card's `anticipation`, via the identical
 * `rollBandFromAnticipation` a human's reduced-motion fallback uses), and
 * the two bands + grips go through the one symmetric
 * `rollFaceoffHeadToHead` - never a separate path for either side. A
 * `scrumOnLoss` card downgrades its own bearer's loss into a scrum
 * afterward, then the user's card is settled and the draw finishes through
 * the existing `resolveDuel`/`applyOutcome` outcome table.
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
    // A repeat jump: no roll for the user, the CPU wins by default.
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

  // scrumOnLoss: converts the LOSING side's own bearer's loss into a scrum
  // instead - symmetric, checked after the roll (or the forfeit) either way.
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

  // Only meaningful for turn-order bookkeeping downstream (activeTeam after
  // DISMISS_DUEL_RESULT); puck placement itself comes entirely from
  // `result.outcome`, read directly off `duel.faceoffResult` in
  // `engine/duelOutcome.ts`. A scrum has no real "winner", so this
  // attribution is an arbitrary (but deterministic) default of 'attacker'.
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
 * Auto-resolves a faceoff without a real drop reaction: rolls a band
 * weighted by the picked card's anticipation, the same `rollBandFromAnticipation`
 * the reduced-motion/headless fallback uses (never `jump` - a false start
 * is human-only, exactly as `miss` is UI-only for shots), then finishes
 * through `resolveFaceoffBand` - one path, no second RNG source. Used for
 * the `prefers-reduced-motion` fallback and the headless sim (see
 * `ai/autoplay.ts`), so the user centre is measured the same way as the
 * CPU centre rather than by an unscored guess.
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
 * Which of a pair of defending dots: the one nearest `shooterRow`, ties
 * broken by a seeded flip - rewards positioning rather than being
 * arbitrary. `dots` is always the `[row 1, row 5]` pair from
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
