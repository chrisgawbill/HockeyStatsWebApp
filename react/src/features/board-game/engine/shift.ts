import {
  ACTIVATIONS_PER_SHIFT,
  MOVE_ALLOWANCE,
} from '@/features/board-game/data/balance';
import { FORMATIONS, ROLES } from '@/features/board-game/data/formations';
import { FACEOFF_SPOTS } from '@/features/board-game/data/rink';
import { isStunned } from '@/features/board-game/engine/rink';
import { getCarrier, isBoxedIn } from '@/features/board-game/engine/selectors';
import type {
  GameState,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';

const TEAMS: TeamId[] = ['user', 'cpu'];

/** The other team. */
export function otherTeam(team: TeamId): TeamId {
  return team === 'user' ? 'cpu' : 'user';
}

/** Every skater back on its starting tile, stuns cleared. Shared by a new game and a whistle reset. */
export function formationSkaters(): Skater[] {
  return TEAMS.flatMap((team) =>
    ROLES.map((role) => ({
      id: `${team}-${role}`,
      team,
      role,
      pos: FORMATIONS[team][role],
      stunned: false,
    })),
  );
}

/**
 * Opens a shift with `initiative` taking the first activation. Stuns are
 * kept, so a faceoff's `stunLoser` lasts through the shift it opens.
 */
export function startShift(state: GameState, initiative: TeamId): GameState {
  return {
    ...state,
    phase: 'move',
    shift: state.shift + 1,
    initiative,
    activeTeam: initiative,
    activationsLeft: {
      user: ACTIVATIONS_PER_SHIFT,
      cpu: ACTIVATIONS_PER_SHIFT,
    },
    activatedSkaterIds: [],
    activeSkaterId: null,
    stepsLeft: MOVE_ALLOWANCE + state.pendingBonusSteps,
    activationPath: [],
    pendingBonusSteps: 0,
  };
}

function hasEligibleSkater(state: GameState, team: TeamId): boolean {
  return state.skaters.some(
    (s) =>
      s.team === team &&
      s.role !== 'G' &&
      !isStunned(s) &&
      !state.activatedSkaterIds.includes(s.id),
  );
}

/** Blows the whistle on a boxed-in carrier: full formation reset and a centre-ice faceoff. */
function whistleIfBoxedIn(state: GameState): GameState {
  const carrier = getCarrier(state);
  if (!carrier || !isBoxedIn(state, carrier.id)) return state;
  return {
    ...state,
    skaters: formationSkaters(),
    puck: { kind: 'loose', pos: FACEOFF_SPOTS.centreIce },
    screen: null,
    phase: 'faceoff',
    whistle: true,
    faceoffSpot: FACEOFF_SPOTS.centreIce,
  };
}

/**
 * Hands the next activation to the other team, or back to this one once the
 * other is out. A team with activations left but no eligible skater forfeits
 * them. When both teams are out, stuns clear and the next shift opens with
 * the team that went second this shift.
 */
function handOverActivation(state: GameState): GameState {
  const activationsLeft = { ...state.activationsLeft };
  for (const team of [otherTeam(state.activeTeam), state.activeTeam]) {
    if (activationsLeft[team] === 0) continue;
    if (hasEligibleSkater(state, team))
      return { ...state, activationsLeft, activeTeam: team };
    activationsLeft[team] = 0;
  }

  const skaters = state.skaters.map((s) =>
    s.stunned ? { ...s, stunned: false } : s,
  );
  return startShift({ ...state, skaters }, otherTeam(state.initiative));
}

/**
 * Closes the current activation: records its skater (if any moved or
 * acted), spends one of the team's activations and hands over the next.
 */
export function completeActivation(state: GameState): GameState {
  const activatedSkaterIds = state.activeSkaterId
    ? [...state.activatedSkaterIds, state.activeSkaterId]
    : state.activatedSkaterIds;
  const spent: GameState = {
    ...state,
    phase: 'move',
    activatedSkaterIds,
    activationsLeft: {
      ...state.activationsLeft,
      [state.activeTeam]: state.activationsLeft[state.activeTeam] - 1,
    },
    activeSkaterId: null,
    stepsLeft: MOVE_ALLOWANCE,
    activationPath: [],
  };
  return whistleIfBoxedIn(handOverActivation(spent));
}
