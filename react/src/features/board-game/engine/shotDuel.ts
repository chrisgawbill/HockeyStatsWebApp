/**
 * Shot minigame integration (BG-A14b): wires BG-A14a's band/save model into
 * the real game as an ante pick plus a save roll, replacing the old shot
 * card duel. A shot never draws a full card-duel hand or plans CPU rounds -
 * the shooter's side draws a 3-card ante from the shot pool via the same
 * `drawFilteredCards` BG-A13 built, picks one, and the engine rolls the
 * save through `rollShotSave` (identical for the user and the CPU). The
 * goalie never touches cards; its poise now lives on `GameState.goaliePoise`.
 */
import { GOALIE_POISE_BY_LENGTH } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import { drawFilteredCards } from '@/features/board-game/engine/deck';
import { resolveDuel } from '@/features/board-game/engine/duel';
import {
  removeIdsFromHand,
  settleCards,
  type Side,
} from '@/features/board-game/engine/duelShared';
import {
  bandWidthsForAccuracy,
  rollBandFromAccuracy,
  rollCpuShotBand,
  rollShotSave,
  shotAccuracyBonus,
} from '@/features/board-game/engine/shotModel';
import type {
  Deck,
  DuelState,
  GameState,
  ShotBand,
  ShotBandWidths,
} from '@/features/board-game/types/game';

/** Cards offered in a shot ante. */
export const SHOT_ANTE_SIZE = 3;

function isShotCard(cardId: string): boolean {
  return CARDS[cardId]?.tags.includes('shot') ?? false;
}

/** Draws up to `SHOT_ANTE_SIZE` shot-pool cards into `deck.hand` as the ante offer. A short offer is possible (and fine) if the deck's shot cards are exhausted. */
function drawShotOffer(deck: Deck, seed: number): [Deck, number] {
  return drawFilteredCards(deck, SHOT_ANTE_SIZE, seed, isShotCard);
}

/**
 * Simple "go for it" ante policy: picks the highest-power card offered. Used
 * by the CPU shooter here, and reused by `ai/autoplay.ts`'s headless sim to
 * drive the user shooter's ante the same way.
 */
export function pickBestShotCard(offer: string[]): string {
  return offer.reduce((best, id) =>
    (CARDS[id]?.power ?? 0) > (CARDS[best]?.power ?? 0) ? id : best,
  );
}

/**
 * Starts a shot: builds the duel shell (no card hands, no CPU plan - a shot
 * isn't a card duel) and draws the shooter's ante. A user shooter waits in
 * phase `'duel'` for `PICK_SHOT_CARD` then `RESOLVE_SHOT_BAND`; a CPU
 * shooter has no UI, so it picks its card and rolls its band immediately
 * and resolves in this same call, through the identical `resolveShotBand`.
 */
export function createShotDuel(
  state: GameState,
  attackerId: string,
  defenderId: string,
): GameState {
  const attackerSkater = state.skaters.find((s) => s.id === attackerId)!;
  const userSide: Side =
    attackerSkater.team === 'user' ? 'attacker' : 'defender';

  const duelBase: DuelState = {
    kind: 'shot',
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
    faceoffCpuCardId: null,
    faceoffJumped: false,
    faceoffResult: null,
  };
  const anteState: GameState = { ...state, duel: duelBase, lastReveal: null };

  if (attackerSkater.team === 'user') {
    const [deck, seed] = drawShotOffer(state.deck, state.rngSeed);
    return { ...anteState, deck, rngSeed: seed, phase: 'duel' };
  }

  const [cpuDeck, seed1] = drawShotOffer(state.cpuDeck, state.rngSeed);
  const pickedCardId = pickBestShotCard(cpuDeck.hand);
  const [band, seed2] = rollCpuShotBand(seed1);
  return resolveShotBand(
    { ...anteState, cpuDeck, rngSeed: seed2 },
    pickedCardId,
    band,
  );
}

/** True if `handIndex` is a legal ante pick right now: an active shot duel, no pick made yet, and a real hand card. */
export function canPickShotCard(state: GameState, handIndex: number): boolean {
  const duel = state.duel;
  if (!duel || duel.kind !== 'shot' || duel.shotPickedCardId !== null)
    return false;
  return state.deck.hand[handIndex] !== undefined;
}

/** The user shooter picks their ante card. The timing bar comes next in the UI; its band is reported via `resolveShotBand`. */
export function pickShotCard(state: GameState, handIndex: number): GameState {
  if (!canPickShotCard(state, handIndex)) return state;
  const cardId = state.deck.hand[handIndex];
  return { ...state, duel: { ...state.duel!, shotPickedCardId: cardId } };
}

/**
 * Auto-resolves a shot without a timing-bar press: rolls a band weighted by
 * the picked card's accuracy (wing perk included), the same
 * `rollBandFromAccuracy` the CPU uses, then finishes through
 * `resolveShotBand` - one path, no second RNG source. For BG-B22's
 * `prefers-reduced-motion` fallback, and the headless BG-A10 sim (see
 * `ai/autoplay.ts`), so the user shooter is measured the same way as the
 * CPU rather than by an unscored guess.
 */
export function autoResolveShot(state: GameState): GameState {
  const duel = state.duel!;
  const pickedCardId = duel.shotPickedCardId!;
  const shooterSkater = state.skaters.find(
    (s) => s.id === duel.attacker.skaterId,
  )!;
  const accuracy =
    (CARDS[pickedCardId]?.accuracy ?? 0) +
    shotAccuracyBonus(shooterSkater.role);
  const [band, seed] = rollBandFromAccuracy(accuracy, state.rngSeed);
  return resolveShotBand({ ...state, rngSeed: seed }, pickedCardId, band);
}

/**
 * The timing-bar band widths for the current shot's picked card, wing perk
 * included - the contract BG-B22's UI renders directly, never hardcoding
 * geometry. Null until a card is picked, or outside a shot duel.
 */
export function shotBandWidthsFor(state: GameState): ShotBandWidths | null {
  const duel = state.duel;
  if (!duel || duel.kind !== 'shot' || duel.shotPickedCardId === null)
    return null;
  const card = CARDS[duel.shotPickedCardId];
  if (!card) return null;
  const shooterSkater = state.skaters.find(
    (s) => s.id === duel.attacker.skaterId,
  )!;
  const accuracy = (card.accuracy ?? 0) + shotAccuracyBonus(shooterSkater.role);
  return bandWidthsForAccuracy(accuracy);
}

/**
 * Resolves a shot once its band is known (the UI's timing-bar press, or the
 * CPU's `rollCpuShotBand`): rolls `rollShotSave` (the one save path for
 * both shooters), drains the defending goalie's persistent poise by the
 * card's power on a save, settles the picked card, and finishes through the
 * existing `resolveDuel` outcome table - a beat scores, a `weak`/`miss` save
 * freezes (`cleanSave`), a `good`/`perfect` save rebounds. No new outcome
 * kinds: the freeze/rebound split is expressed as a synthetic defender
 * poise/maxPoise pair so `applyOutcome`'s existing shot branch picks the
 * right path.
 */
export function resolveShotBand(
  state: GameState,
  pickedCardId: string,
  band: ShotBand,
): GameState {
  const duel = state.duel!;
  const shooterSkater = state.skaters.find(
    (s) => s.id === duel.attacker.skaterId,
  )!;
  const goalieSkater = state.skaters.find(
    (s) => s.id === duel.defender.skaterId,
  )!;
  const goalieTeam = goalieSkater.team;
  const goalieMaxPoise = GOALIE_POISE_BY_LENGTH[state.length];
  const goaliePoise = state.goaliePoise[goalieTeam];
  const power = CARDS[pickedCardId]?.power ?? 0;

  const [result, seed] = rollShotSave(
    band,
    power,
    goaliePoise,
    goalieMaxPoise,
    state.rngSeed,
  );
  const nextGoaliePoise = Math.max(0, goaliePoise - result.poiseDrain);

  const isUserShooter = shooterSkater.team === 'user';
  const deckKey = isUserShooter ? 'deck' : 'cpuDeck';
  const settledDeck = settleCards(
    removeIdsFromHand(state[deckKey], [pickedCardId]),
    [pickedCardId],
  );

  const winner: Side = result.saved ? 'defender' : 'attacker';
  // Synthetic poise/maxPoise, local to this call: only used so
  // `applyOutcome`'s existing shot branch (poise === maxPoise -> freeze,
  // otherwise -> rebound) picks the right path from `result.freeze`.
  const syntheticDefender = {
    ...duel.defender,
    maxPoise: 1,
    poise: result.freeze ? 1 : 0,
  };

  const preResolve: GameState = {
    ...state,
    [deckKey]: settledDeck,
    rngSeed: seed,
    goaliePoise: { ...state.goaliePoise, [goalieTeam]: nextGoaliePoise },
    lastShotSaveResult: result,
    duel: {
      ...duel,
      shotPickedCardId: pickedCardId,
      defender: syntheticDefender,
    },
  };

  return resolveDuel(preResolve, winner, false);
}
