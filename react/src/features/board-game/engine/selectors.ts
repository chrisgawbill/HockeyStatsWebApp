import { COST } from '@/features/board-game/data/balance';
import {
  isAdjacent,
  isOffensiveZone,
  isPlayable,
  isStunned,
  laneBetween,
  manhattan,
  orthNeighbors,
  skaterAt,
} from '@/features/board-game/engine/rink';
import type { GameState, Skater } from '@/features/board-game/types/game';

/** The skater currently carrying the puck, if any. Team-agnostic. */
export function getCarrier(state: GameState): Skater | undefined {
  const puck = state.puck;
  if (puck.kind !== 'carried') return undefined;
  return state.skaters.find((s) => s.id === puck.skaterId);
}

export function canRoll(state: GameState): boolean {
  return state.phase === 'roll';
}

export function canEndTurn(state: GameState): boolean {
  return state.phase === 'move';
}

/** True if the active team's carrier may `SHOOT` right now. */
export function canShoot(state: GameState): boolean {
  if (state.phase !== 'move' || state.mp < COST.shoot) return false;
  const carrier = getCarrier(state);
  if (!carrier || carrier.team !== state.activeTeam) return false;
  return isOffensiveZone(carrier.team, carrier.pos);
}

/**
 * Teammates `carrier` could legally pass to: non-goalie, non-stunned, at
 * least 2 tiles away in the same row/column with a clear lane. Ignores MP,
 * phase, and whose turn it is - shared by `passTargets` and `isBoxedIn`.
 */
export function eligibleReceivers(state: GameState, carrier: Skater): Skater[] {
  return state.skaters
    .filter((s) => s.team === carrier.team && s.id !== carrier.id)
    .filter((s) => s.role !== 'G')
    .filter((s) => !isStunned(s, state.turn))
    .filter((s) => manhattan(carrier.pos, s.pos) >= 2)
    .filter((s) => laneBetween(carrier.pos, s.pos) !== null);
}

/** Legal receiver ids for the active team's carrier's `PASS`. Empty whenever a pass isn't currently legal. */
export function passTargets(state: GameState): string[] {
  if (state.phase !== 'move' || state.mp < COST.pass) return [];
  const carrier = getCarrier(state);
  if (!carrier || carrier.team !== state.activeTeam) return [];
  return eligibleReceivers(state, carrier).map((s) => s.id);
}

/** True if `skaterId` may `CHECK` right now: own-team, eligible, and adjacent to the enemy carrier. */
export function checkTargets(state: GameState, skaterId: string): boolean {
  if (state.phase !== 'move' || state.mp < COST.check) return false;
  const checker = state.skaters.find((s) => s.id === skaterId);
  if (!checker || checker.team !== state.activeTeam) return false;
  if (checker.role === 'G' || isStunned(checker, state.turn)) return false;

  const carrier = getCarrier(state);
  if (!carrier || carrier.team === checker.team) return false;
  return isAdjacent(checker.pos, carrier.pos);
}

/**
 * True if `skaterId` is boxed in for the §3 whistle rule: no free playable
 * orthogonal neighbor, no eligible pass receiver, and not in its own
 * offensive zone. Ignores whose turn it is, MP, and phase.
 */
export function isBoxedIn(state: GameState, skaterId: string): boolean {
  const skater = state.skaters.find((s) => s.id === skaterId);
  if (!skater) return false;

  const hasFreeNeighbor = orthNeighbors(skater.pos).some(
    (c) => isPlayable(c) && !skaterAt(state, c),
  );
  if (hasFreeNeighbor) return false;
  if (eligibleReceivers(state, skater).length > 0) return false;
  return !isOffensiveZone(skater.team, skater.pos);
}
