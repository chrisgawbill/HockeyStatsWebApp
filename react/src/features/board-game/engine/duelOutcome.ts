import { CARDS } from '@/features/board-game/data/cards';
import { CREASE_FRONT } from '@/features/board-game/data/rink';
import {
  isPlayable,
  isStunned,
  manhattan,
  orthNeighbors,
  skaterAt,
} from '@/features/board-game/engine/rink';
import { nextFloat } from '@/features/board-game/engine/rng';
import type { Side } from '@/features/board-game/engine/duelShared';
import type {
  Coord,
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
  /** `rngSeed` after any rolls this outcome needed (currently only the faceoff scrum tile pick); unchanged if nothing was rolled. */
  rngSeed: number;
  /** MP to add on the winning side's next `ROLL_DICE` (the faceoff `bonusMp` effect). Zero otherwise. */
  bonusMp: number;
}

/** Non-goalie skater on `team` nearest `tile`; prefers non-stunned, falling back to stunned. Ties keep array order. Never moves anyone. */
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

/** The non-goalie skater of `team` on the ice at defense (LD/RD), nearest `tile`. Used by the faceoff `backDraw` effect. */
function nearestDefenseman(
  state: GameState,
  team: TeamId,
  tile: Coord,
): Skater | undefined {
  const candidates = state.skaters.filter(
    (s) => s.team === team && (s.role === 'LD' || s.role === 'RD'),
  );
  return candidates.sort(
    (a, b) => manhattan(a.pos, tile) - manhattan(b.pos, tile),
  )[0];
}

/**
 * Scrum tile for a faceoff that goes loose: seeded from the dot's free
 * orthogonal neighbours (occupied tiles filtered out here). Falls back to
 * the dot itself if every neighbour is blocked (practically unreachable).
 */
function pickScrumTile(
  state: GameState,
  dot: Coord,
  seed: number,
): [Coord, number] {
  const free = orthNeighbors(dot)
    .filter(isPlayable)
    .filter((c) => !skaterAt(state, c));
  if (free.length === 0) return [dot, seed];
  const [t, nextSeed] = nextFloat(seed);
  return [free[Math.floor(t * free.length)], nextSeed];
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
  let rngSeed = state.rngSeed;
  let bonusMp = 0;

  switch (duel.kind) {
    case 'faceoff': {
      // Both centres anted and produced a real band, and
      // `duel.faceoffResult` (set by `resolveFaceoffBand`'s symmetric
      // `rollFaceoffHeadToHead`) already carries the whole outcome,
      // including any `scrumOnLoss` downgrade. `winner` (from
      // `resolveFaceoffBand`) just tells us which physical duelist that
      // outcome favoured.
      const result = duel.faceoffResult!;
      const userCard = duel.faceoffPickedCardId
        ? CARDS[duel.faceoffPickedCardId]
        : undefined;
      const cpuCard = duel.faceoffCpuCardId
        ? CARDS[duel.faceoffCpuCardId]
        : undefined;

      if (result.outcome === 'scrum') {
        const [tile, nextSeed] = pickScrumTile(
          state,
          state.faceoffSpot,
          state.rngSeed,
        );
        puck = { kind: 'loose', pos: tile };
        rngSeed = nextSeed;
        break;
      }

      const winnerIsUser = winner === 'attacker';
      const winnerId = winnerIsUser
        ? duel.attacker.skaterId
        : duel.defender.skaterId;
      puck = { kind: 'carried', skaterId: winnerId };

      // The winner's effect fires only if THEIR OWN band was clean - a
      // late-band win squeaked out on grip alone still just carries the
      // puck, no bonus.
      const wonClean = winnerIsUser
        ? result.userBand === 'clean'
        : result.cpuBand === 'clean';
      const winningCard = winnerIsUser ? userCard : cpuCard;

      if (wonClean && winningCard?.faceoffEffect) {
        const winnerSkater = state.skaters.find((s) => s.id === winnerId)!;
        switch (winningCard.faceoffEffect) {
          case 'backDraw': {
            const d = nearestDefenseman(
              state,
              winnerSkater.team,
              winnerSkater.pos,
            );
            if (d) puck = { kind: 'carried', skaterId: d.id };
            break;
          }
          case 'stunLoser':
            stunSkaterId = winnerIsUser
              ? duel.defender.skaterId
              : duel.attacker.skaterId;
            break;
          case 'bonusMp':
            bonusMp = 1;
            break;
          // `scrumOnLoss` and `freeJump` have no clean-win-time bonus -
          // they're handled above (scrum downgrade) and in
          // `faceoffBandWindowsFor` (re-drop window) respectively.
          default:
            break;
        }
      }
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
        // a defender win in a shot duel is always a timeout.
        const goalieDuelist = duel.defender;
        const goalieSkater = state.skaters.find(
          (s) => s.id === goalieDuelist.skaterId,
        )!;
        const creaseTile = CREASE_FRONT[goalieSkater.team];
        const occupant = skaterAt(state, creaseTile);
        cleanSave = goalieDuelist.poise === goalieDuelist.maxPoise;
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

  return { puck, stunSkaterId, goal, cleanSave, rngSeed, bonusMp };
}
