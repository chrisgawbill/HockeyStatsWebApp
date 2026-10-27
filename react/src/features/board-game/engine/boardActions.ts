import { createDuel } from '@/features/board-game/engine/duel';
import { completeActivation } from '@/features/board-game/engine/shift';
import { createShotDuel } from '@/features/board-game/engine/shotDuel';
import {
  isAdjacent,
  isStunned,
  laneBetween,
  legalSteps,
  manhattan,
  sameCoord,
  skaterAt,
} from '@/features/board-game/engine/rink';
import {
  canShoot,
  checkTargets,
  getCarrier,
  passTargets,
} from '@/features/board-game/engine/selectors';
import type {
  Coord,
  GameState,
  Role,
  Skater,
} from '@/features/board-game/types/game';

/** Deke-trigger priority when several opponents qualify. */
const DEKE_ROLE_ORDER: Role[] = ['C', 'LW', 'RW', 'LD', 'RD'];

function findDekeDefender(
  state: GameState,
  carrier: Skater,
): Skater | undefined {
  const candidates = state.skaters.filter(
    (s) =>
      s.team !== carrier.team &&
      s.role !== 'G' &&
      isAdjacent(s.pos, carrier.pos) &&
      !isStunned(s),
  );
  return candidates.sort(
    (a, b) => DEKE_ROLE_ORDER.indexOf(a.role) - DEKE_ROLE_ORDER.indexOf(b.role),
  )[0];
}

/**
 * `MOVE`: one tile of the activation's allowance, which also makes this
 * skater the activation's skater. Collecting a loose puck is the
 * activation's action; arriving next to an opponent with the puck starts
 * a deke battle, which uses the action instead.
 */
export function handleMove(
  state: GameState,
  skaterId: string,
  to: Coord,
): GameState {
  const legal = legalSteps(state, skaterId).some((c) => sameCoord(c, to));
  if (!legal) return state;

  const skaters = state.skaters.map((s) =>
    s.id === skaterId ? { ...s, pos: to } : s,
  );
  const picksUpLoosePuck =
    state.puck.kind === 'loose' && sameCoord(state.puck.pos, to);
  const puck = picksUpLoosePuck
    ? { kind: 'carried' as const, skaterId }
    : state.puck;

  const nextState: GameState = {
    ...state,
    skaters,
    puck,
    activeSkaterId: skaterId,
    stepsLeft: state.stepsLeft - 1,
  };

  const isNowCarrier =
    nextState.puck.kind === 'carried' && nextState.puck.skaterId === skaterId;
  if (!isNowCarrier) return nextState;

  const carrier = skaters.find((s) => s.id === skaterId)!;
  const defender = findDekeDefender(nextState, carrier);
  if (defender) return createDuel(nextState, 'deke', skaterId, defender.id);
  return picksUpLoosePuck ? completeActivation(nextState) : nextState;
}

/** `PASS`: the carrier's action - either an intercept duel or a completed pass. The receiver is not activated. */
export function handlePass(state: GameState, toSkaterId: string): GameState {
  if (!passTargets(state).includes(toSkaterId)) return state;
  const carrier = getCarrier(state)!;
  const receiver = state.skaters.find((s) => s.id === toSkaterId)!;
  const lane = laneBetween(carrier.pos, receiver.pos)!.sort(
    (a, b) => manhattan(carrier.pos, a) - manhattan(carrier.pos, b),
  );

  const spentState: GameState = { ...state, activeSkaterId: carrier.id };

  for (const tile of lane) {
    const occupant = skaterAt(state, tile);
    if (
      occupant &&
      occupant.team !== carrier.team &&
      occupant.role !== 'G' &&
      !isStunned(occupant)
    ) {
      return createDuel(
        spentState,
        'intercept',
        carrier.id,
        occupant.id,
        toSkaterId,
      );
    }
  }

  return completeActivation({
    ...spentState,
    puck: { kind: 'carried', skaterId: toSkaterId },
  });
}

/** `SHOOT`: the carrier's action - a shot duel against the opposing goalie. */
export function handleShoot(state: GameState): GameState {
  if (!canShoot(state)) return state;
  const carrier = getCarrier(state)!;
  const goalie = state.skaters.find(
    (s) => s.team !== carrier.team && s.role === 'G',
  )!;
  const spentState: GameState = { ...state, activeSkaterId: carrier.id };
  return createShotDuel(spentState, carrier.id, goalie.id);
}

/** `CHECK`: the checker's action - a check duel against the enemy carrier. */
export function handleCheck(state: GameState, skaterId: string): GameState {
  if (!checkTargets(state, skaterId)) return state;
  const carrier = getCarrier(state)!;
  const spentState: GameState = { ...state, activeSkaterId: skaterId };
  return createDuel(spentState, 'check', skaterId, carrier.id);
}
