import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
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
import {
  currentStreak,
  hasStreakBonus,
  loadStreak,
  recordWin,
  type StreakData,
} from '@/features/board-game/data/dailyStreak';
import { pushRemoteStreak } from '@/features/board-game/api/streakSync';

export interface UseBoardGame {
  state: GameState;
  dispatch: Dispatch<Action>;
  legalSteps: (id: string) => Coord[];
  newGame: () => void;
  cpuThinking: boolean;
  streakData: StreakData;
  streak: number;
}

/** Owns the match reducer and steps the CPU's turn on a timer. No rules live here. */
export function useBoardGame(
  initialSeed: number,
  length: GameLength,
  /** Google sign-in session token (BG-B31), or `null` when signed out. */
  authToken: string | null = null,
): UseBoardGame {
  const [streakData, setStreakData] = useState<StreakData>(() => loadStreak());
  const streakDataRef = useRef(streakData);
  const currentGameIdRef = useRef(0);
  const recordedWinGameIdRef = useRef<number | null>(null);
  const initialBonusEnergy = hasStreakBonus(streakData) ? 1 : 0;

  const [state, baseDispatch] = useReducer(gameReducer, initialSeed, (seed) =>
    createInitialState(seed, length, initialBonusEnergy),
  );

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const dispatch = useCallback<Dispatch<Action>>((action) => {
    if (action.type === 'NEW_GAME') {
      currentGameIdRef.current += 1;
      recordedWinGameIdRef.current = null;
      baseDispatch({
        ...action,
        bonusEnergy: hasStreakBonus(streakDataRef.current) ? 1 : 0,
      });
      return;
    }

    baseDispatch(action);
  }, []);

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
  }, [dispatch, state.length]);

  useEffect(() => {
    if (state.phase !== 'gameOver' || state.winner !== 'user') return;
    if (recordedWinGameIdRef.current === currentGameIdRef.current) return;

    recordedWinGameIdRef.current = currentGameIdRef.current;
    const updated = recordWin(streakDataRef.current);
    streakDataRef.current = updated;
    setStreakData(updated);

    // Fire-and-forget: sync the win to the server without blocking gameplay.
    // Errors are logged and swallowed, matching every other step of the
    // optional Google sign-in sync (see docs/board-game-backlog.md, BG-B31).
    if (authToken) {
      pushRemoteStreak(authToken, updated).catch((error) => {
        console.error('Failed to sync streak after win:', error);
      });
    }
  }, [state.phase, state.winner, authToken]);

  const streak = useMemo(() => currentStreak(streakData), [streakData]);

  return {
    state,
    dispatch,
    legalSteps,
    newGame,
    cpuThinking,
    streakData,
    streak,
  };
}
