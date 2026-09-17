import { CPU_TURN_ACTION_CAP } from '@/features/board-game/data/balance';
import { CREASE_FRONT } from '@/features/board-game/data/rink';
import { otherTeam } from '@/features/board-game/engine/gameReducer';
import {
  isAdjacent,
  isPlayable,
  isStunned,
  legalSteps,
  manhattan,
  orthNeighbors,
  sameCoord,
  skaterAt,
} from '@/features/board-game/engine/rink';
import {
  canRoll,
  canShoot,
  checkTargets,
  getCarrier,
  passTargets,
} from '@/features/board-game/engine/selectors';
import type {
  Action,
  Coord,
  GameState,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';

/** Number of legal-step tiles adjacent to `tile` held by non-stunned opponents of `team`. */
function threatCount(state: GameState, team: TeamId, tile: Coord): number {
  return state.skaters.filter(
    (s) =>
      s.team !== team && !isStunned(s, state.turn) && isAdjacent(s.pos, tile),
  ).length;
}

function coordKey(c: Coord): string {
  return `${c.col},${c.row}`;
}

/**
 * Shortest-path distance from every reachable tile to `target`, treating
 * every occupied tile (except `mover`'s own, and `target` itself) as an
 * obstacle. Real reachability, not manhattan distance - manhattan can send
 * a one-step-lookahead picker oscillating forever around a single blocker.
 */
function distancesTo(
  state: GameState,
  mover: Skater,
  target: Coord,
): Map<string, number> {
  const distances = new Map<string, number>([[coordKey(target), 0]]);
  const queue: Coord[] = [target];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(coordKey(current))!;
    for (const next of orthNeighbors(current)) {
      const key = coordKey(next);
      if (distances.has(key) || !isPlayable(next)) continue;
      const occupant = skaterAt(state, next);
      if (occupant && occupant.id !== mover.id && !sameCoord(next, target))
        continue;
      distances.set(key, currentDist + 1);
      queue.push(next);
    }
  }
  return distances;
}

/**
 * The legal step for `skaterId` that shortens the path to `target` the most,
 * breaking ties by fewest threats then array order. Returns null ("no
 * useful step") when no legal step gets any closer.
 */
function pickStepToward(
  state: GameState,
  skaterId: string,
  target: Coord,
): Coord | null {
  const mover = state.skaters.find((s) => s.id === skaterId);
  const steps = legalSteps(state, skaterId);
  if (!mover || steps.length === 0) return null;

  const distances = distancesTo(state, mover, target);
  const fallback = (c: Coord) => manhattan(c, target);
  const currentDist = distances.get(coordKey(mover.pos)) ?? fallback(mover.pos);

  const scored = steps.map((step, index) => ({
    step,
    index,
    dist: distances.get(coordKey(step)) ?? fallback(step),
    threats: threatCount(state, mover.team, step),
  }));
  scored.sort(
    (a, b) => a.dist - b.dist || a.threats - b.threats || a.index - b.index,
  );

  const best = scored[0];
  if (best.dist >= currentDist) return null;
  return best.step;
}

function pickForwardPass(
  state: GameState,
  team: TeamId,
  carrier: Skater,
): string | null {
  const direction = team === 'cpu' ? -1 : 1;
  for (const id of passTargets(state)) {
    const receiver = state.skaters.find((s) => s.id === id)!;
    const gain = (receiver.pos.col - carrier.pos.col) * direction;
    if (gain >= 3) return id;
  }
  return null;
}

function pickChaser(state: GameState, target: Coord): Skater | undefined {
  const candidates = state.skaters
    .map((s, index) => ({ s, index }))
    .filter(({ s }) => legalSteps(state, s.id).length > 0);
  if (candidates.length === 0) return undefined;
  candidates.sort(
    (a, b) =>
      manhattan(a.s.pos, target) - manhattan(b.s.pos, target) ||
      a.index - b.index,
  );
  return candidates[0].s;
}

/**
 * The heuristic board AI, parametrized by team so the same
 * policy can drive either side (used to mirror the user in headless sims).
 */
export function chooseActionFor(state: GameState, team: TeamId): Action {
  if (state.activeTeam !== team) return { type: 'END_TURN' };
  if (state.phase !== 'roll' && state.phase !== 'move')
    return { type: 'END_TURN' };
  if (state.actionsThisTurn >= CPU_TURN_ACTION_CAP) return { type: 'END_TURN' };
  if (canRoll(state)) return { type: 'ROLL_DICE' };

  const carrier = getCarrier(state);
  if (carrier && carrier.team === team) {
    if (canShoot(state)) return { type: 'SHOOT' };

    const passTarget = pickForwardPass(state, team, carrier);
    if (passTarget) return { type: 'PASS', toSkaterId: passTarget };

    const netTarget = CREASE_FRONT[otherTeam(team)];
    const step = pickStepToward(state, carrier.id, netTarget);
    if (step) return { type: 'MOVE', skaterId: carrier.id, to: step };

    // Last resort: any legal pass beats stalling forever on a surrounded carrier.
    const anyPassTarget = passTargets(state)[0];
    if (anyPassTarget) return { type: 'PASS', toSkaterId: anyPassTarget };

    // Truly last resort: a carrier can have one free neighbor that doesn't
    // shorten the path to net (so pickStepToward finds "no useful step")
    // without being isBoxedIn (zero free neighbors) - e.g. boxed in by its
    // own teammates. Take the step anyway rather than looping END_TURN with
    // the puck frozen in place.
    const anyStep = legalSteps(state, carrier.id)[0];
    if (anyStep) return { type: 'MOVE', skaterId: carrier.id, to: anyStep };
    return { type: 'END_TURN' };
  }

  const puckTarget = carrier
    ? carrier.pos
    : state.puck.kind === 'loose'
      ? state.puck.pos
      : null;
  if (!puckTarget) return { type: 'END_TURN' };

  const chaser = pickChaser(state, puckTarget);
  if (!chaser) return { type: 'END_TURN' };
  if (checkTargets(state, chaser.id))
    return { type: 'CHECK', skaterId: chaser.id };

  const step = pickStepToward(state, chaser.id, puckTarget);
  if (step) return { type: 'MOVE', skaterId: chaser.id, to: step };
  return { type: 'END_TURN' };
}

/** The CPU's pure, deterministic board decision; it uses no RNG. */
export const chooseCpuAction = (state: GameState): Action =>
  chooseActionFor(state, 'cpu');
