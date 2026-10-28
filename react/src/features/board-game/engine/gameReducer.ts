import {
  ACTIVATIONS_PER_SHIFT,
  GOALIE_POISE_BY_LENGTH,
  MOVE_ALLOWANCE,
} from '@/features/board-game/data/balance';
import { composePlaybook } from '@/features/board-game/data/playbooks';
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
import {
  autoResolveShot,
  pickShotCard,
  resolveShotBand,
} from '@/features/board-game/engine/shotDuel';
import { canEndActivation } from '@/features/board-game/engine/selectors';
import {
  completeActivation,
  formationSkaters,
  startShift,
} from '@/features/board-game/engine/shift';
import type {
  Action,
  GameLength,
  GameState,
} from '@/features/board-game/types/game';

/** Builds a fresh match: starting formations, the puck dropped at center, awaiting the opening faceoff. */
export function createInitialState(
  seed: number,
  length: GameLength,
  bonusEnergy = 0,
): GameState {
  const [deck, seed1] = createDeck(composePlaybook(), seed);
  const [cpuDeck, rngSeed] = createDeck(composePlaybook(), seed1);

  return {
    phase: 'faceoff',
    length,
    bonusEnergy: bonusEnergy > 0 ? 1 : 0,
    activeTeam: 'user',
    shift: 0,
    initiative: 'user',
    activationsLeft: {
      user: ACTIVATIONS_PER_SHIFT,
      cpu: ACTIVATIONS_PER_SHIFT,
    },
    activatedSkaterIds: [],
    activeSkaterId: null,
    stepsLeft: MOVE_ALLOWANCE,
    activationPath: [],
    skaters: formationSkaters(),
    puck: { kind: 'loose', pos: FACEOFF_SPOTS.centreIce },
    deck,
    cpuDeck,
    duel: null,
    lastOutcome: null,
    lastReveal: null,
    winner: null,
    rngSeed,
    whistle: false,
    goaliePoise: {
      user: GOALIE_POISE_BY_LENGTH[length],
      cpu: GOALIE_POISE_BY_LENGTH[length],
    },
    lastShotSaveResult: null,
    lastFaceoffResult: null,
    faceoffSpot: FACEOFF_SPOTS.centreIce,
    pendingBonusSteps: 0,
  };
}

/** The single state-change entry point. Returns the same reference for any illegal action. */
export function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === 'NEW_GAME')
    return createInitialState(action.seed, action.length, action.bonusEnergy);
  if (state.phase === 'gameOver') return state;

  switch (action.type) {
    case 'START_FACEOFF': {
      if (state.phase !== 'faceoff') return state;
      return {
        ...createFaceoffDuel(state, 'user-C', 'cpu-C'),
        whistle: false,
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

    case 'END_ACTIVATION':
      if (!canEndActivation(state)) return state;
      return completeActivation(state);

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
        return startShift(
          {
            ...state,
            lastOutcome: null,
            lastShotSaveResult: null,
            lastFaceoffResult: null,
          },
          winnerTeam,
        );
      }
      // A covered save whistles play dead and ends the shift, routing to the
      // end-zone dot nearest the shooter's row on the goalie's own team's
      // side (ties broken by a seeded flip). Only the two centres move and
      // stuns clear; everyone else stays put (unlike the boxed-in-carrier
      // whistle, a full reset).
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
          skaters: state.skaters.map((s) => ({
            ...s,
            stunned: false,
            pos: s.id === 'user-C' || s.id === 'cpu-C' ? dot : s.pos,
          })),
          puck: { kind: 'loose', pos: dot },
          phase: 'faceoff',
          whistle: true,
          faceoffSpot: dot,
          rngSeed: seed,
          lastOutcome: null,
          lastShotSaveResult: null,
          lastFaceoffResult: null,
        };
      }
      // Any other battle used the activation's action.
      return completeActivation({
        ...state,
        lastOutcome: null,
        lastShotSaveResult: null,
        lastFaceoffResult: null,
      });
    }

    default:
      return state;
  }
}
