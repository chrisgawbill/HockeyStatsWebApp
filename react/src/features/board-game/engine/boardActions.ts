import { createDuel } from '@/features/board-game/engine/duel';
import { createShotDuel } from '@/features/board-game/engine/shotDuel';
import {
  isAdjacent,
  isDefensiveZone,
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
      !isStunned(s, state.turn),
  );
  return candidates.sort(
    (a, b) => DEKE_ROLE_ORDER.indexOf(a.role) - DEKE_ROLE_ORDER.indexOf(b.role),
  )[0];
}

/** Move one step during the selected skater's activation, picking up the puck and checking the deke trigger. */
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

  const nextMovement = state.movementRemaining - 1;
  const nextState: GameState = {
    ...state,
    skaters,
    puck,
    movementRemaining:
      state.defensemanZoneMovement &&
      !isDefensiveZone(state.skaters.find((s) => s.id === skaterId)!.team, to)
        ? Math.min(nextMovement, 1)
        : nextMovement,
  };

  const isNowCarrier =
    nextState.puck.kind === 'carried' && nextState.puck.skaterId === skaterId;
  if (!isNowCarrier) return nextState;

  const carrier = skaters.find((s) => s.id === skaterId)!;
  const defender = findDekeDefender(nextState, carrier);
  if (!defender) return nextState;

  return createDuel(
    { ...nextState, actionTaken: true },
    'deke',
    skaterId,
    defender.id,
  );
}

/** `PASS`: either starts an intercept duel or completes the pass to the receiver. */
export function handlePass(state: GameState, toSkaterId: string): GameState {
  if (!passTargets(state).includes(toSkaterId)) return state;
  const carrier = getCarrier(state)!;
  const receiver = state.skaters.find((s) => s.id === toSkaterId)!;
  const lane = laneBetween(carrier.pos, receiver.pos)!.sort(
    (a, b) => manhattan(carrier.pos, a) - manhattan(carrier.pos, b),
  );

  const actionState: GameState = { ...state, actionTaken: true };

  for (const tile of lane) {
    const occupant = skaterAt(state, tile);
    if (
      occupant &&
      occupant.team !== carrier.team &&
      occupant.role !== 'G' &&
      !isStunned(occupant, state.turn)
    ) {
      return createDuel(
        actionState,
        'intercept',
        carrier.id,
        occupant.id,
        toSkaterId,
      );
    }
  }

  return { ...actionState, puck: { kind: 'carried', skaterId: toSkaterId } };
}

/** `SHOOT`: starts a shot duel against the opposing goalie. */
export function handleShoot(state: GameState): GameState {
  if (!canShoot(state)) return state;
  const carrier = getCarrier(state)!;
  const goalie = state.skaters.find(
    (s) => s.team !== carrier.team && s.role === 'G',
  )!;
  return createShotDuel({ ...state, actionTaken: true }, carrier.id, goalie.id);
}

/** `CHECK`: starts a check duel against the enemy carrier. */
export function handleCheck(state: GameState, skaterId: string): GameState {
  if (!checkTargets(state, skaterId)) return state;
  const carrier = getCarrier(state)!;
  return createDuel(
    { ...state, actionTaken: true },
    'check',
    skaterId,
    carrier.id,
  );
}
