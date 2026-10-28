import {
  canActivate,
  canStep,
  isAdjacent,
  isOffensiveZone,
  isStunned,
  laneBetween,
  neighbors,
  tileDistance,
} from '@/features/board-game/engine/rink';
import type { GameState, Skater } from '@/features/board-game/types/game';

const SCREEN_ROLES = ['C', 'LW', 'RW'] as const;
const SCREEN_ROWS = [2, 3, 4] as const;
const CLEAR_CREASE_ROLES = ['LD', 'RD'] as const;

/** The skater currently carrying the puck, if any. Team-agnostic. */
export function getCarrier(state: GameState): Skater | undefined {
  const puck = state.puck;
  if (puck.kind !== 'carried') return undefined;
  return state.skaters.find((s) => s.id === puck.skaterId);
}

export function canEndActivation(state: GameState): boolean {
  return state.phase === 'move';
}

/** The active team's carrier, if it may take the current activation's action. */
function activeCarrier(state: GameState): Skater | undefined {
  if (state.phase !== 'move') return undefined;
  const carrier = getCarrier(state);
  return carrier && canActivate(state, carrier) ? carrier : undefined;
}

/** True if the active team's carrier may `SHOOT` right now. */
export function canShoot(state: GameState): boolean {
  const carrier = activeCarrier(state);
  return !!carrier && isOffensiveZone(carrier.team, carrier.pos);
}

/** True when `skaterId` may spend its action to establish the net-front screen. */
export function canSetScreen(state: GameState, skaterId: string): boolean {
  if (state.phase !== 'move' || state.screen) return false;
  const screener = state.skaters.find((s) => s.id === skaterId);
  const carrier = getCarrier(state);
  if (
    !screener ||
    !SCREEN_ROLES.includes(screener.role as (typeof SCREEN_ROLES)[number]) ||
    !canActivate(state, screener) ||
    !carrier ||
    carrier.team !== screener.team ||
    carrier.id === screener.id ||
    !isOffensiveZone(carrier.team, carrier.pos)
  )
    return false;
  const frontColumn = carrier.team === 'user' ? 13 : 1;
  return (
    screener.pos.col === frontColumn &&
    SCREEN_ROWS.includes(screener.pos.row as (typeof SCREEN_ROWS)[number])
  );
}

/** True when `skaterId` may spend its action to challenge the active screen. */
export function canClearCrease(state: GameState, skaterId: string): boolean {
  if (state.phase !== 'move' || !state.screen) return false;
  const clearer = state.skaters.find((s) => s.id === skaterId);
  const screener = state.skaters.find((s) => s.id === state.screen!.screenerId);
  return !!(
    clearer &&
    screener &&
    CLEAR_CREASE_ROLES.includes(
      clearer.role as (typeof CLEAR_CREASE_ROLES)[number],
    ) &&
    clearer.team !== screener.team &&
    canActivate(state, clearer) &&
    isAdjacent(clearer.pos, screener.pos)
  );
}

/** Removes a screen when its team loses possession, leaves the zone, or the screener gets the puck. */
export function expireInvalidScreen(state: GameState): GameState {
  if (!state.screen) return state;
  const carrier = getCarrier(state);
  if (
    carrier?.team === state.screen.team &&
    carrier.id !== state.screen.screenerId &&
    isOffensiveZone(carrier.team, carrier.pos)
  )
    return state;
  return { ...state, screen: null };
}

/**
 * Teammates `carrier` could legally pass to: non-goalie, non-stunned, at
 * least 2 tiles away in the same row, column or straight diagonal. Ignores
 * phase and activations - shared by `passTargets` and `isBoxedIn`.
 */
export function eligibleReceivers(state: GameState, carrier: Skater): Skater[] {
  return state.skaters
    .filter((s) => s.team === carrier.team && s.id !== carrier.id)
    .filter((s) => s.role !== 'G')
    .filter((s) => !isStunned(s))
    .filter((s) => tileDistance(carrier.pos, s.pos) >= 2)
    .filter((s) => laneBetween(carrier.pos, s.pos) !== null);
}

/** Legal receiver ids for the active team's carrier's `PASS`. Empty whenever a pass isn't currently legal. */
export function passTargets(state: GameState): string[] {
  const carrier = activeCarrier(state);
  if (!carrier) return [];
  return eligibleReceivers(state, carrier).map((s) => s.id);
}

/** True if `skaterId` may `CHECK` right now: able to take this activation and adjacent to the enemy carrier. */
export function checkTargets(state: GameState, skaterId: string): boolean {
  if (state.phase !== 'move') return false;
  const checker = state.skaters.find((s) => s.id === skaterId);
  if (!checker || !canActivate(state, checker)) return false;

  const carrier = getCarrier(state);
  if (!carrier || carrier.team === checker.team) return false;
  return isAdjacent(checker.pos, carrier.pos);
}

/**
 * True if `skaterId` is boxed in for the §3 whistle rule: no legal step in
 * any of the eight directions, no eligible pass receiver, and not in its own
 * offensive zone. Ignores whose activation it is and phase.
 */
export function isBoxedIn(state: GameState, skaterId: string): boolean {
  const skater = state.skaters.find((s) => s.id === skaterId);
  if (!skater) return false;

  const hasLegalStep = neighbors(skater.pos).some((to) =>
    canStep(state, skater.pos, to),
  );
  if (hasLegalStep) return false;
  if (eligibleReceivers(state, skater).length > 0) return false;
  return !isOffensiveZone(skater.team, skater.pos);
}
