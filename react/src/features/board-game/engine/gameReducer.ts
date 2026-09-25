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
import {
  autoResolveShot,
  pickShotCard,
  resolveShotBand,
} from '@/features/board-game/engine/shotDuel';
import {
  canActivate,
  canEndActivation,
  getCarrier,
  isBoxedIn,
} from '@/features/board-game/engine/selectors';
import { isDefensiveZone, isStunned } from '@/features/board-game/engine/rink';
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
  bonusEnergy = 0,
): GameState {
  const [deck, seed1] = createDeck(STARTER_DECK, seed);
  const [cpuDeck, rngSeed] = createDeck(STARTER_DECK, seed1);

  return {
    phase: 'faceoff',
    length,
    bonusEnergy: bonusEnergy > 0 ? 1 : 0,
    activeTeam: 'user',
    initiativeTeam: 'user',
    activationsRemaining: { user: 3, cpu: 3 },
    activatedSkaters: [],
    activationSkaterId: null,
    movementRemaining: 0,
    defensemanZoneMovement: false,
    actionTaken: false,
    pendingBonusMovement: { user: false, cpu: false },
    openingActivationComplete: false,
    turn: 1,
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
  };
}

function beginActivation(state: GameState, skaterId: string): GameState {
  if (state.activationSkaterId === skaterId) return state;
  if (state.activationSkaterId || !canActivate(state, skaterId)) return state;
  const skater = state.skaters.find((s) => s.id === skaterId)!;
  const bonus =
    state.openingActivationComplete && state.pendingBonusMovement[skater.team];
  const defensemanZoneMovement =
    (skater.role === 'LD' || skater.role === 'RD') &&
    isDefensiveZone(skater.team, skater.pos);
  return {
    ...state,
    activationSkaterId: skaterId,
    movementRemaining: (defensemanZoneMovement ? 3 : 2) + Number(bonus),
    defensemanZoneMovement,
    pendingBonusMovement: bonus
      ? { ...state.pendingBonusMovement, [skater.team]: false }
      : state.pendingBonusMovement,
  };
}

function finishActivation(state: GameState): GameState {
  const team = state.activeTeam;
  const remaining = {
    ...state.activationsRemaining,
    [team]: state.activationsRemaining[team] - 1,
  };
  const turn = state.turn + 1;
  const openingActivationComplete =
    state.openingActivationComplete || team === state.initiativeTeam;
  const skaters = state.skaters.map((s) =>
    s.stunnedUntilTurn !== null && turn > s.stunnedUntilTurn
      ? { ...s, stunnedUntilTurn: null }
      : s,
  );
  let initiativeTeam = state.initiativeTeam;
  let activeTeam = otherTeam(team);
  let activatedSkaters = state.activationSkaterId
    ? [...state.activatedSkaters, state.activationSkaterId]
    : state.activatedSkaters;
  if (remaining.user === 0 && remaining.cpu === 0) {
    initiativeTeam = otherTeam(state.initiativeTeam);
    activeTeam = initiativeTeam;
    remaining.user = 3;
    remaining.cpu = 3;
    activatedSkaters = [];
  }
  let next: GameState = {
    ...state,
    phase: 'move',
    turn,
    activeTeam,
    initiativeTeam,
    activationsRemaining: remaining,
    activatedSkaters,
    activationSkaterId: null,
    movementRemaining: 0,
    defensemanZoneMovement: false,
    actionTaken: false,
    openingActivationComplete,
    skaters,
  };
  // A stunned-only team forfeits its remaining opportunities so the game cannot stall.
  while (
    next.activationsRemaining[next.activeTeam] > 0 &&
    !next.skaters.some(
      (s) =>
        s.team === next.activeTeam &&
        s.role !== 'G' &&
        !isStunned(s, next.turn) &&
        !next.activatedSkaters.includes(s.id),
    )
  ) {
    next = {
      ...next,
      activationsRemaining: {
        ...next.activationsRemaining,
        [next.activeTeam]: 0,
      },
      turn: next.turn + 1,
      activeTeam: otherTeam(next.activeTeam),
    };
    if (
      next.activationsRemaining.user === 0 &&
      next.activationsRemaining.cpu === 0
    ) {
      next = {
        ...next,
        initiativeTeam: otherTeam(next.initiativeTeam),
        activeTeam: otherTeam(next.initiativeTeam),
        activationsRemaining: { user: 3, cpu: 3 },
        activatedSkaters: [],
      };
    }
  }
  return next;
}

function completeActivation(state: GameState): GameState {
  const next = finishActivation(state);
  const carrier = getCarrier(next);
  if (!carrier || !isBoxedIn(next, carrier.id)) return next;
  return {
    ...next,
    skaters: formationSkaters(),
    puck: { kind: 'loose', pos: FACEOFF_SPOTS.centreIce },
    phase: 'faceoff',
    activationsRemaining: { user: 3, cpu: 3 },
    activatedSkaters: [],
    activationSkaterId: null,
    movementRemaining: 0,
    defensemanZoneMovement: false,
    actionTaken: false,
    pendingBonusMovement: { user: false, cpu: false },
    openingActivationComplete: false,
    whistle: true,
    faceoffSpot: FACEOFF_SPOTS.centreIce,
  };
}

/** The other team. */
export function otherTeam(team: TeamId): TeamId {
  return team === 'user' ? 'cpu' : 'user';
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

    case 'ACTIVATE_SKATER':
      return beginActivation(state, action.skaterId);

    case 'MOVE': {
      const active = beginActivation(state, action.skaterId);
      const next = handleMove(active, action.skaterId, action.to);
      return next.actionTaken && next.phase === 'move'
        ? completeActivation(next)
        : next;
    }

    case 'PASS': {
      const carrier = getCarrier(state);
      if (!carrier) return state;
      const active = beginActivation(state, carrier.id);
      const next = handlePass(active, action.toSkaterId);
      return next.actionTaken && next.phase === 'move'
        ? completeActivation(next)
        : next;
    }

    case 'SHOOT': {
      const carrier = getCarrier(state);
      if (!carrier) return state;
      return handleShoot(beginActivation(state, carrier.id));
    }

    case 'CHECK':
      return handleCheck(
        beginActivation(state, action.skaterId),
        action.skaterId,
      );

    case 'END_ACTIVATION': {
      if (!canEndActivation(state)) return state;
      return completeActivation(state);
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
          phase: 'move',
          activeTeam: winnerTeam,
          initiativeTeam: winnerTeam,
          activationsRemaining: { user: 3, cpu: 3 },
          activatedSkaters: [],
          activationSkaterId: null,
          movementRemaining: 0,
          defensemanZoneMovement: false,
          actionTaken: false,
          openingActivationComplete: false,
          lastOutcome: null,
          lastShotSaveResult: null,
          lastFaceoffResult: null,
        };
      }
      // A covered save whistles play dead, routing to the end-zone dot
      // nearest the shooter's row on the goalie's own team's side (ties
      // broken by a seeded flip). Only the two centres move; everyone else
      // stays put (unlike the boxed-in-carrier whistle above, a full reset).
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
          activationsRemaining: { user: 3, cpu: 3 },
          activatedSkaters: [],
          activationSkaterId: null,
          movementRemaining: 0,
          defensemanZoneMovement: false,
          actionTaken: false,
          pendingBonusMovement: { user: false, cpu: false },
          openingActivationComplete: false,
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
        ...completeActivation({ ...state, lastOutcome: null }),
        lastOutcome: null,
        lastShotSaveResult: null,
        lastFaceoffResult: null,
      };
    }

    default:
      return state;
  }
}
