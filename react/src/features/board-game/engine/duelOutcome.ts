import { CREASE_FRONT } from '@/features/board-game/data/rink';
import {
  isStunned,
  manhattan,
  skaterAt,
} from '@/features/board-game/engine/rink';
import type { Side } from '@/features/board-game/engine/duelShared';
import type {
  DuelState,
  GameState,
  Puck,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';

/** The puck/stun/goal result of resolving a finished duel, per the §4 outcome table. */
export interface DuelOutcomeResult {
  puck: Puck;
  stunSkaterId: string | null;
  goal: boolean;
  /** Shot duel, defender (goalie) wins: true if the goalie took no poise damage all duel (a clean-save freeze), false on a rebound. */
  cleanSave: boolean;
}

/**
 * The non-goalie skater on `team` nearest `tile`; prefers non-stunned skaters,
 * falling back to stunned ones. Ties keep array order. Never moves anyone.
 */
function nearestSkaterOfTeam(
  state: GameState,
  team: TeamId,
  tile: { col: number; row: number },
): Skater | undefined {
  const candidates = state.skaters.filter(
    (s) => s.team === team && s.role !== 'G',
  );
  const nonStunned = candidates.filter((s) => !isStunned(s, state.turn));
  const pool = nonStunned.length > 0 ? nonStunned : candidates;
  return pool.sort(
    (a, b) => manhattan(a.pos, tile) - manhattan(b.pos, tile),
  )[0];
}

/** Applies the §4 outcome table for a finished duel: who gets the puck, who's stunned, and whether it's a goal. */
export function applyOutcome(
  state: GameState,
  duel: DuelState,
  winner: Side,
): DuelOutcomeResult {
  let puck = state.puck;
  let stunSkaterId: string | null = null;
  let goal = false;
  let cleanSave = false;

  switch (duel.kind) {
    case 'faceoff': {
      const winnerId =
        winner === 'attacker' ? duel.attacker.skaterId : duel.defender.skaterId;
      puck = { kind: 'carried', skaterId: winnerId };
      break;
    }
    case 'deke': {
      if (winner === 'attacker') {
        stunSkaterId = duel.defender.skaterId;
      } else {
        puck = { kind: 'carried', skaterId: duel.defender.skaterId };
        stunSkaterId = duel.attacker.skaterId;
      }
      break;
    }
    case 'check': {
      if (winner === 'attacker') {
        puck = { kind: 'carried', skaterId: duel.attacker.skaterId };
        stunSkaterId = duel.defender.skaterId;
      } else {
        stunSkaterId = duel.attacker.skaterId;
      }
      break;
    }
    case 'intercept': {
      puck =
        winner === 'attacker'
          ? { kind: 'carried', skaterId: duel.receiverId! }
          : { kind: 'carried', skaterId: duel.defender.skaterId };
      break;
    }
    case 'shot': {
      if (winner === 'attacker') {
        goal = true;
      } else {
        // Goalies only block, so the attacker can never KO the goalie's opponent here -
        // a defender win in a shot duel is always a timeout now (see BG-A9).
        const goalieDuelist = duel.defender;
        const goalieSkater = state.skaters.find(
          (s) => s.id === goalieDuelist.skaterId,
        )!;
        const creaseTile = CREASE_FRONT[goalieSkater.team];
        const occupant = skaterAt(state, creaseTile);
        cleanSave = goalieDuelist.poise === goalieDuelist.maxPoise;
        // PM ruling: freeze gives possession to the goalie's team without teleporting anyone.
        if (cleanSave) {
          const carrier =
            occupant ??
            nearestSkaterOfTeam(state, goalieSkater.team, creaseTile);
          puck = carrier
            ? { kind: 'carried', skaterId: carrier.id }
            : { kind: 'loose', pos: creaseTile };
        } else {
          puck = occupant
            ? { kind: 'carried', skaterId: occupant.id }
            : { kind: 'loose', pos: creaseTile };
        }
      }
      break;
    }
  }

  return { puck, stunSkaterId, goal, cleanSave };
}
