import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
} from 'react';
import type {
  Action,
  Coord,
  GameLength,
  GameState,
} from '@/features/board-game/types/game';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import { legalSteps as engineLegalSteps } from '@/features/board-game/engine/rink';
import { chooseCpuAction } from '@/features/board-game/ai/cpuBoardAgent';
import {
  CPU_STEP_MS,
  CPU_TURN_ACTION_CAP,
} from '@/features/board-game/data/balance';

export interface UseBoardGame {
  state: GameState;
  dispatch: Dispatch<Action>;
  legalSteps: (id: string) => Coord[];
  newGame: () => void;
  cpuThinking: boolean;
}

/** Owns the match reducer and steps the CPU's turn on a timer. No rules live here. */
export function useBoardGame(
  initialSeed: number,
  length: GameLength,
): UseBoardGame {
  const [state, dispatch] = useReducer(gameReducer, initialSeed, (seed) =>
    createInitialState(seed, length),
  );

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const cpuThinking =
    state.activeTeam === 'cpu' &&
    (state.phase === 'roll' || state.phase === 'move');

  useEffect(() => {
    if (!cpuThinking) return;
    const delay = reducedMotion ? 0 : CPU_STEP_MS;
    const timer = setTimeout(() => {
      if (state.actionsThisTurn >= CPU_TURN_ACTION_CAP) {
        dispatch({ type: 'END_TURN' });
      } else {
        dispatch(chooseCpuAction(state));
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [state, cpuThinking, reducedMotion]);

  const legalSteps = useCallback(
    (id: string) => engineLegalSteps(state, id),
    [state],
  );

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME', seed: Date.now(), length: state.length });
  }, [state.length]);

  return { state, dispatch, legalSteps, newGame, cpuThinking };
}
