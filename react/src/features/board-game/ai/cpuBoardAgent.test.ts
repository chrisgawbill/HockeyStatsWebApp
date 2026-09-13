import { describe, expect, it } from 'vitest';
import { CPU_TURN_ACTION_CAP } from '@/features/board-game/data/balance';
import { playHeadlessGame } from '@/features/board-game/ai/autoplay';
import { chooseCpuAction } from '@/features/board-game/ai/cpuBoardAgent';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import type { DuelKind, GameLength } from '@/features/board-game/types/game';

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
  it('returns END_TURN outside the roll/move phases or when it is not the CPU turn', () => {
    const state = createInitialState(1, 'long'); // phase faceoff, activeTeam user
    expect(chooseCpuAction(state)).toEqual({ type: 'END_TURN' });
  });

  it('returns a legal action once it is the CPU turn (verified by the reducer actually changing state, or END_TURN)', () => {
    let state = createInitialState(2, 'long');
    state = gameReducer(state, { type: 'START_FACEOFF' });
    // Force a state where it's the CPU's turn to roll, regardless of who won the faceoff duel.
    state = { ...state, duel: null, phase: 'roll', activeTeam: 'cpu' };
    const action = chooseCpuAction(state);
    const next = gameReducer(state, action);
    expect(action.type === 'END_TURN' || next !== state).toBe(true);
  });
});

describe('200 seeded headless games per length', () => {
  it.each(LENGTHS)(
    'all 200 %s games end in gameOver within 400 turns, and no turn exceeds the action cap',
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
        expect(result.maxActionsInATurn).toBeLessThanOrEqual(
          CPU_TURN_ACTION_CAP,
        );

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
