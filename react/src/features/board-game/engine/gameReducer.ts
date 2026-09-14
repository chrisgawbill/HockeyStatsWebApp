import { GOALIE_POISE_BY_LENGTH } from '@/features/board-game/data/balance';
import { STARTER_DECK } from '@/features/board-game/data/cards';
import { FORMATIONS, ROLES } from '@/features/board-game/data/formations';
import { FACEOFF_SPOTS } from '@/features/board-game/data/rink';
import {
  handleCheck,
  handleMove,
  handlePass,
  handleShoot,
} from '@/features/board-game/engine/boardActions';
import { createDeck } from '@/features/board-game/engine/deck';
import {
  endDuelRound,
  playCard,
  unqueueCard,
} from '@/features/board-game/engine/duel';
import {
  autoResolveFaceoff,
  createFaceoffDuel,
  pickDefendingDot,
  pickFaceoffCard,
  resolveFaceoffBand,
} from '@/features/board-game/engine/faceoffDuel';
import { rollDie } from '@/features/board-game/engine/rng';
import {
  autoResolveShot,
  pickShotCard,
  resolveShotBand,
} from '@/features/board-game/engine/shotDuel';
import {
  canEndTurn,
  canRoll,
  getCarrier,
  isBoxedIn,
} from '@/features/board-game/engine/selectors';
import type {
  Action,
  GameLength,
  GameState,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';

const TEAMS: TeamId[] = ['user', 'cpu'];

/** Every skater back on its starting tile, stuns cleared. Shared by a new game and a whistle reset. */
function formationSkaters(): Skater[] {
  return TEAMS.flatMap((team) =>
    ROLES.map((role) => ({
      id: `${team}-${role}`,
      team,
      role,
      pos: FORMATIONS[team][role],
      stunnedUntilTurn: null,
    })),
  );
}

/** Builds a fresh match: starting formations, the puck dropped at center, awaiting the opening faceoff. */
export function createInitialState(
  seed: number,
  length: GameLength,
): GameState {
  const [deck, seed1] = createDeck(STARTER_DECK, seed);
  const [cpuDeck, rngSeed] = createDeck(STARTER_DECK, seed1);

  return {
    phase: 'faceoff',
    length,
    activeTeam: 'user',
    turn: 1,
    mp: 0,
    dice: null,
    skaters: formationSkaters(),
    puck: { kind: 'loose', pos: FACEOFF_SPOTS.centreIce },
    deck,
    cpuDeck,
    duel: null,
    lastOutcome: null,
    lastReveal: null,
    winner: null,
    rngSeed,
    actionsThisTurn: 0,
    whistle: false,
    goaliePoise: {
      user: GOALIE_POISE_BY_LENGTH[length],
      cpu: GOALIE_POISE_BY_LENGTH[length],
    },
    lastShotSaveResult: null,
    lastFaceoffResult: null,
    faceoffSpot: FACEOFF_SPOTS.centreIce,
    pendingBonusMp: 0,
  };
}

/** The other team. */
export function otherTeam(team: TeamId): TeamId {
  return team === 'user' ? 'cpu' : 'user';
}

/** The single state-change entry point. Returns the same reference for any illegal action. */
export function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === 'NEW_GAME')
    return createInitialState(action.seed, action.length);
  if (state.phase === 'gameOver') return state;

  switch (action.type) {
    case 'START_FACEOFF': {
      if (state.phase !== 'faceoff') return state;
      return {
        ...createFaceoffDuel(state, 'user-C', 'cpu-C'),
        whistle: false,
      };
    }

    case 'ROLL_DICE': {
      if (!canRoll(state)) return state;
      const [d1, seed1] = rollDie(state.rngSeed);
      const [d2, seed2] = rollDie(seed1);
      return {
        ...state,
        dice: [d1, d2],
        mp: d1 + d2 + state.pendingBonusMp,
        pendingBonusMp: 0,
        phase: 'move',
        rngSeed: seed2,
      };
    }

    case 'MOVE':
      return handleMove(state, action.skaterId, action.to);

    case 'PASS':
      return handlePass(state, action.toSkaterId);

    case 'SHOOT':
      return handleShoot(state);

    case 'CHECK':
      return handleCheck(state, action.skaterId);

    case 'END_TURN': {
      if (!canEndTurn(state)) return state;
      const turn = state.turn + 1;
      const skaters = state.skaters.map((s) =>
        s.stunnedUntilTurn !== null && turn > s.stunnedUntilTurn
          ? { ...s, stunnedUntilTurn: null }
          : s,
      );
      const switched: GameState = {
        ...state,
        turn,
        activeTeam: otherTeam(state.activeTeam),
        phase: 'roll',
        mp: 0,
        dice: null,
        actionsThisTurn: 0,
        skaters,
      };

      const carrier = getCarrier(switched);
      if (carrier && isBoxedIn(switched, carrier.id)) {
        return {
          ...switched,
          skaters: formationSkaters(),
          puck: { kind: 'loose', pos: FACEOFF_SPOTS.centreIce },
          phase: 'faceoff',
          activeTeam: 'user',
          mp: 0,
          dice: null,
          whistle: true,
          faceoffSpot: FACEOFF_SPOTS.centreIce,
        };
      }

      return switched;
    }

    case 'PLAY_CARD':
      return playCard(state, action.handIndex);

    case 'UNQUEUE_CARD':
      return unqueueCard(state, action.queueIndex);

    case 'END_DUEL_ROUND':
      return endDuelRound(state);

    case 'PICK_SHOT_CARD':
      return pickShotCard(state, action.handIndex);

    case 'RESOLVE_SHOT_BAND': {
      const duel = state.duel;
      if (
        !duel ||
        duel.kind !== 'shot' ||
        duel.shotPickedCardId === null ||
        state.phase !== 'duel'
      )
        return state;
      return resolveShotBand(state, duel.shotPickedCardId, action.band);
    }

    case 'AUTO_RESOLVE_SHOT': {
      const duel = state.duel;
      if (
        !duel ||
        duel.kind !== 'shot' ||
        duel.shotPickedCardId === null ||
        state.phase !== 'duel'
      )
        return state;
      return autoResolveShot(state);
    }

    case 'PICK_FACEOFF_CARD':
      return pickFaceoffCard(state, action.handIndex);

    case 'RESOLVE_FACEOFF_BAND': {
      const duel = state.duel;
      if (
        !duel ||
        duel.kind !== 'faceoff' ||
        duel.faceoffPickedCardId === null ||
        state.phase !== 'duel'
      )
        return state;
      return resolveFaceoffBand(state, duel.faceoffPickedCardId, action.band);
    }

    case 'AUTO_RESOLVE_FACEOFF': {
      const duel = state.duel;
      if (
        !duel ||
        duel.kind !== 'faceoff' ||
        duel.faceoffPickedCardId === null ||
        state.phase !== 'duel'
      )
        return state;
      return autoResolveFaceoff(state);
    }

    case 'DISMISS_DUEL_RESULT': {
      if (state.phase !== 'duelResult' || !state.lastOutcome) return state;
      const outcome = state.lastOutcome;
      if (outcome.kind === 'faceoff') {
        const winnerId =
          outcome.winner === 'attacker'
            ? outcome.attackerId
            : outcome.defenderId;
        const winnerTeam = state.skaters.find((s) => s.id === winnerId)!.team;
        return {
          ...state,
          phase: 'roll',
          activeTeam: winnerTeam,
          mp: 0,
          dice: null,
          lastOutcome: null,
          lastShotSaveResult: null,
          lastFaceoffResult: null,
        };
      }
      // BG-A16/A15b: a covered save whistles play dead and routes to the
      // end-zone dot in front of the net it was covered in front of - the
      // goalie's own team's dots, nearest the shooter's row (ties broken by
      // a seeded flip, same rule as any other end-zone draw). Only the two
      // centres move to the dot; everyone else stays put (unlike the
      // boxed-in-carrier whistle above, which is always a full reset).
      if (outcome.kind === 'shot' && state.lastShotSaveResult?.covered) {
        const goalieTeam = state.skaters.find(
          (s) => s.id === outcome.defenderId,
        )!.team;
        const shooterRow = state.skaters.find(
          (s) => s.id === outcome.attackerId,
        )!.pos.row;
        const [dot, seed] = pickDefendingDot(
          FACEOFF_SPOTS.defendingDots[goalieTeam],
          shooterRow,
          state.rngSeed,
        );
        return {
          ...state,
          skaters: state.skaters.map((s) =>
            s.id === 'user-C' || s.id === 'cpu-C' ? { ...s, pos: dot } : s,
          ),
          puck: { kind: 'loose', pos: dot },
          phase: 'faceoff',
          activeTeam: 'user',
          mp: 0,
          dice: null,
          whistle: true,
          faceoffSpot: dot,
          rngSeed: seed,
          lastOutcome: null,
          lastShotSaveResult: null,
          lastFaceoffResult: null,
        };
      }
      return {
        ...state,
        phase: 'move',
        lastOutcome: null,
        lastShotSaveResult: null,
        lastFaceoffResult: null,
      };
    }

    default:
      return state;
  }
}
