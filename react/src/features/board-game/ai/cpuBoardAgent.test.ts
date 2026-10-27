import { describe, expect, it } from 'vitest';
import { playHeadlessGame } from '@/features/board-game/ai/autoplay';
import { chooseCpuAction } from '@/features/board-game/ai/cpuBoardAgent';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import type { DuelKind, GameLength } from '@/features/board-game/types/game';

const GAME_COUNT = 200;
const MAX_SHIFTS = 200;
const DUEL_KINDS: DuelKind[] = [
  'faceoff',
  'deke',
  'check',
  'intercept',
  'shot',
];
const LENGTHS: GameLength[] = ['short', 'long'];

describe('chooseCpuAction', () => {
  it('returns END_ACTIVATION outside the move phase or when it is not the CPU activation', () => {
    const state = createInitialState(1, 'long'); // phase faceoff, activeTeam user
    expect(chooseCpuAction(state)).toEqual({ type: 'END_ACTIVATION' });
  });

  it('returns a legal action on the CPU activation (the reducer changes state)', () => {
    let state = createInitialState(2, 'long');
    state = gameReducer(state, { type: 'START_FACEOFF' });
    // Force the CPU's activation, regardless of who won the faceoff duel.
    state = { ...state, duel: null, phase: 'move', activeTeam: 'cpu' };
    const next = gameReducer(state, chooseCpuAction(state));
    expect(next).not.toBe(state);
  });
});

describe('200 seeded headless games per length', () => {
  it.each(LENGTHS)(
    'all 200 %s games end in gameOver within 200 shifts',
    (length) => {
      let userWins = 0;
      let cpuWins = 0;
      let totalShifts = 0;
      let whistles = 0;
      const byKind: Record<DuelKind, { attacker: number; defender: number }> = {
        faceoff: { attacker: 0, defender: 0 },
        deke: { attacker: 0, defender: 0 },
        check: { attacker: 0, defender: 0 },
        intercept: { attacker: 0, defender: 0 },
        shot: { attacker: 0, defender: 0 },
      };

      for (let seed = 1; seed <= GAME_COUNT; seed++) {
        const result = playHeadlessGame(seed, length, MAX_SHIFTS);
        expect(result.finalState.phase).toBe('gameOver');
        expect(result.shifts).toBeLessThanOrEqual(MAX_SHIFTS);

        if (result.finalState.winner === 'user') userWins++;
        if (result.finalState.winner === 'cpu') cpuWins++;
        totalShifts += result.shifts;
        whistles += result.whistles;
        for (const outcome of result.duelOutcomes)
          byKind[outcome.kind][outcome.winner]++;
      }

      expect(userWins + cpuWins).toBe(GAME_COUNT);

      const userWinRate = ((userWins / GAME_COUNT) * 100).toFixed(1);
      const cpuWinRate = ((cpuWins / GAME_COUNT) * 100).toFixed(1);
      const avgShifts = (totalShifts / GAME_COUNT).toFixed(1);
      // eslint-disable-next-line no-console
      console.info(
        `[BG-A10 balance sim, ${length}] ${GAME_COUNT} games, both sides on planCards: blue (user) ${userWinRate}%, red (cpu) ${cpuWinRate}%, avg shifts ${avgShifts}, whistles ${whistles}`,
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
