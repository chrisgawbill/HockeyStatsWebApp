import { describe, expect, it } from 'vitest';
import { playHeadlessGame } from '@/features/board-game/ai/autoplay';
import { chooseCpuAction } from '@/features/board-game/ai/cpuBoardAgent';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import type {
  DuelKind,
  GameLength,
  GameState,
} from '@/features/board-game/types/game';

const GAME_COUNT = 200;
const MAX_TURNS = 400;
const DUEL_KINDS: DuelKind[] = [
  'faceoff',
  'deke',
  'check',
  'intercept',
  'shot',
];
const LENGTHS: GameLength[] = ['short', 'long'];

describe('chooseCpuAction', () => {
  it('does not act outside the activation phase or when it is not the CPU turn', () => {
    const state = createInitialState(1, 'long'); // phase faceoff, activeTeam user
    expect(chooseCpuAction(state)).toEqual({ type: 'END_ACTIVATION' });
  });

  it('selects a skater when it is the CPU activation', () => {
    let state = createInitialState(2, 'long');
    state = gameReducer(state, { type: 'START_FACEOFF' });
    state = {
      ...state,
      duel: null,
      phase: 'move',
      activeTeam: 'cpu',
      initiativeTeam: 'cpu',
    };
    const action = chooseCpuAction(state);
    const next = gameReducer(state, action);
    expect(action.type).toBe('ACTIVATE_SKATER');
    expect(next.activationSkaterId).not.toBeNull();
  });

  it('advances the carrier when a pass receiver cannot activate later this shift', () => {
    const initial = createInitialState(3, 'long');
    const state = {
      ...initial,
      phase: 'move' as const,
      activeTeam: 'cpu' as const,
      activationSkaterId: 'cpu-C',
      activationsRemaining: { user: 3, cpu: 2 },
      activatedSkaters: ['cpu-LW'],
      movementRemaining: 2,
      puck: { kind: 'carried' as const, skaterId: 'cpu-C' },
      skaters: initial.skaters.map((s) => {
        if (s.id === 'cpu-LW') return { ...s, pos: { col: 5, row: 3 } };
        if (s.id === 'user-C') return { ...s, pos: { col: 6, row: 2 } };
        return s;
      }),
    };

    expect(chooseCpuAction(state)).toEqual({
      type: 'MOVE',
      skaterId: 'cpu-C',
      to: { col: 7, row: 3 },
    });
    expect(
      chooseCpuAction({
        ...state,
        activationsRemaining: { user: 3, cpu: 1 },
        activatedSkaters: [],
      }),
    ).toEqual({
      type: 'MOVE',
      skaterId: 'cpu-C',
      to: { col: 7, row: 3 },
    });
  });

  it('moves a support skater toward the attacking end when the carrier already activated', () => {
    const initial = createInitialState(4, 'long');
    let state: GameState = {
      ...initial,
      phase: 'move' as const,
      activeTeam: 'cpu' as const,
      initiativeTeam: 'cpu' as const,
      activationsRemaining: { user: 3, cpu: 2 },
      activatedSkaters: ['cpu-LW'],
      puck: { kind: 'carried' as const, skaterId: 'cpu-LW' },
      skaters: initial.skaters.map((s) =>
        s.id === 'cpu-LW' ? { ...s, pos: { col: 11, row: 5 } } : s,
      ),
    };
    state = gameReducer(state, chooseCpuAction(state));

    expect(state.activationSkaterId).not.toBe('cpu-LW');
    const support = state.skaters.find(
      (skater) => skater.id === state.activationSkaterId,
    )!;
    const action = chooseCpuAction(state);
    expect(action.type).toBe('MOVE');
    if (action.type === 'MOVE') expect(action.skaterId).toBe(support.id);
  });
});

describe('200 seeded headless games per length', () => {
  it.each(LENGTHS)(
    'all 200 %s games end in gameOver within 400 turns',
    (length) => {
      let userWins = 0;
      let cpuWins = 0;
      let totalTurns = 0;
      let whistles = 0;
      const byKind: Record<DuelKind, { attacker: number; defender: number }> = {
        faceoff: { attacker: 0, defender: 0 },
        deke: { attacker: 0, defender: 0 },
        check: { attacker: 0, defender: 0 },
        intercept: { attacker: 0, defender: 0 },
        shot: { attacker: 0, defender: 0 },
      };

      for (let seed = 1; seed <= GAME_COUNT; seed++) {
        const result = playHeadlessGame(seed, length, MAX_TURNS);
        expect(result.finalState.phase).toBe('gameOver');
        expect(result.turns).toBeLessThanOrEqual(MAX_TURNS);

        if (result.finalState.winner === 'user') userWins++;
        if (result.finalState.winner === 'cpu') cpuWins++;
        totalTurns += result.turns;
        whistles += result.whistles;
        for (const outcome of result.duelOutcomes)
          byKind[outcome.kind][outcome.winner]++;
      }

      expect(userWins + cpuWins).toBe(GAME_COUNT);

      const userWinRate = ((userWins / GAME_COUNT) * 100).toFixed(1);
      const cpuWinRate = ((cpuWins / GAME_COUNT) * 100).toFixed(1);
      const avgTurns = (totalTurns / GAME_COUNT).toFixed(1);
      // eslint-disable-next-line no-console
      console.info(
        `[BG-A10 balance sim, ${length}] ${GAME_COUNT} games, both sides on planCards: blue (user) ${userWinRate}%, red (cpu) ${cpuWinRate}%, avg turns ${avgTurns}, whistles ${whistles}`,
      );

      const table = DUEL_KINDS.map((kind) => {
        const { attacker, defender } = byKind[kind];
        const total = attacker + defender;
        const attackerPct =
          total > 0 ? ((attacker / total) * 100).toFixed(0) : '-';
        return `${kind.padEnd(10)} attacker ${String(attacker).padStart(4)} (${attackerPct}%)  defender ${String(defender).padStart(4)}  total ${total}`;
      }).join('\n');
      // eslint-disable-next-line no-console
      console.info(
        `[BG-A10 duel wins by kind, attacker vs defender, ${length}]\n${table}`,
      );
    },
  );
});
