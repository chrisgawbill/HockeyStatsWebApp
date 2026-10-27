import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import { GameState } from '@/features/board-game/types/game';

export function makeShootState(seed = 1): GameState {
  const state = createInitialState(seed, 'long');
  const skaters = state.skaters.map((s) =>
    s.id === 'user-C' ? { ...s, pos: { col: 11, row: 3 } } : s,
  );
  return {
    ...state,
    phase: 'move',
    skaters,
    puck: { kind: 'carried', skaterId: 'user-C' },
  };
}

export function makeFaceoffState(seed = 1): GameState {
  const state = createInitialState(seed, 'long');
  return gameReducer(state, { type: 'START_FACEOFF' });
}
export function withFaceoffCards(
  state: GameState,
  userCardId: string,
  cpuCardId: string,
): GameState {
  return {
    ...state,
    deck: { ...state.deck, hand: [userCardId] },
    duel: { ...state.duel!, faceoffCpuCardId: cpuCardId },
  };
}

export function shotState(seed: number): GameState {
  const initial = createInitialState(seed, 'short');
  return {
    ...initial,
    phase: 'move',
    skaters: initial.skaters.map((skater) =>
      skater.id === 'user-C' ? { ...skater, pos: { col: 11, row: 3 } } : skater,
    ),
    puck: { kind: 'carried', skaterId: 'user-C' },
  };
}

export function makeMoveState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(1, 'long'),
    phase: 'move',
    activeTeam: 'user',
    ...overrides,
  };
}
