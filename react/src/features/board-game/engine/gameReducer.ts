import { GOALIE_POISE_BY_LENGTH } from '@/features/board-game/data/balance';
import { STARTER_DECK } from '@/features/board-game/data/cards';
import { FORMATIONS, ROLES } from '@/features/board-game/data/formations';
import {
  handleCheck,
  handleMove,
  handlePass,
  handleShoot,
} from '@/features/board-game/engine/boardActions';
import { createDeck } from '@/features/board-game/engine/deck';
import {
  createDuel,
  endDuelRound,
  playCard,
  unqueueCard,
} from '@/features/board-game/engine/duel';
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
  Coord,
  GameLength,
  GameState,
  Skater,
  TeamId,
} from '@/features/board-game/types/game';

const TEAMS: TeamId[] = ['user', 'cpu'];
const CENTER_ICE: Coord = { col: 7, row: 3 };

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
    puck: { kind: 'loose', pos: CENTER_ICE },
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
        ...createDuel(state, 'faceoff', 'user-C', 'cpu-C'),
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
        mp: d1 + d2,
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
          puck: { kind: 'loose', pos: CENTER_ICE },
          phase: 'faceoff',
          activeTeam: 'user',
          mp: 0,
          dice: null,
          whistle: true,
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
        };
      }
      return {
        ...state,
        phase: 'move',
        lastOutcome: null,
        lastShotSaveResult: null,
      };
    }

    default:
      return state;
  }
}
