import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import type { GameState } from '@/features/board-game/types/game';

function boardState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(1, 'long'),
    phase: 'move',
    ...overrides,
  };
}

function activate(state: GameState, skaterId: string): GameState {
  return gameReducer(state, { type: 'ACTIVATE_SKATER', skaterId });
}

describe('alternating activation economy', () => {
  it('starts with three activations and gives the faceoff winner initiative', () => {
    const state = boardState({
      phase: 'duelResult',
      lastOutcome: {
        kind: 'faceoff',
        winner: 'attacker',
        byKo: false,
        attackerId: 'cpu-C',
        defenderId: 'user-C',
        goal: false,
        cleanSave: false,
        summary: 'faceoff',
        receiverId: null,
      },
    });
    const next = gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    expect(next.phase).toBe('move');
    expect(next.initiativeTeam).toBe('cpu');
    expect(next.activeTeam).toBe('cpu');
    expect(next.activationsRemaining).toEqual({ user: 3, cpu: 3 });
  });

  it('alternates each activation, resets after six, and alternates shift initiative', () => {
    let state = boardState();
    for (const id of [
      'user-C',
      'cpu-C',
      'user-LW',
      'cpu-LW',
      'user-RW',
      'cpu-RW',
    ]) {
      state = activate(state, id);
      state = gameReducer(state, { type: 'END_ACTIVATION' });
    }
    expect(state.activationsRemaining).toEqual({ user: 3, cpu: 3 });
    expect(state.activatedSkaters).toEqual([]);
    expect(state.initiativeTeam).toBe('cpu');
    expect(state.activeTeam).toBe('cpu');
    state = activate(state, 'cpu-C');
    state = gameReducer(state, { type: 'END_ACTIVATION' });
    expect(state.activeTeam).toBe('user');
    expect(state.activationsRemaining).toEqual({ user: 3, cpu: 2 });
  });

  it('allows several movement steps then one action, and rejects reuse of the skater', () => {
    let state = activate(
      boardState({
        skaters: createInitialState(1, 'long').skaters.map((s) =>
          s.id === 'user-RW'
            ? { ...s, pos: { col: 7, row: 1 } }
            : s.team === 'cpu' && s.role !== 'G'
              ? {
                  ...s,
                  pos: {
                    col: 12,
                    row: ['LW', 'C', 'RW', 'LD', 'RD'].indexOf(s.role) + 1,
                  },
                }
              : s,
        ),
      }),
      'user-C',
    );
    state = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-C',
      to: { col: 7, row: 3 },
    });
    expect(state.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(state.movementRemaining).toBe(1);
    state = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-C',
      to: { col: 7, row: 4 },
    });
    expect(state.movementRemaining).toBe(0);
    expect(state.phase).toBe('move');
    state = gameReducer(state, { type: 'PASS', toSkaterId: 'user-RW' });
    expect(state.puck).toEqual({ kind: 'carried', skaterId: 'user-RW' });
    expect(state.activeTeam).toBe('cpu');
    expect(state.activatedSkaters).toContain('user-C');
    expect(state.activatedSkaters).not.toContain('user-RW');
    const secondAction = gameReducer(state, {
      type: 'PASS',
      toSkaterId: 'user-C',
    });
    expect(secondAction).toBe(state);
    const rejected = gameReducer(state, {
      type: 'ACTIVATE_SKATER',
      skaterId: 'user-C',
    });
    expect(rejected).toBe(state);
  });

  it('keeps the current activation through a battle and advances when it resolves', () => {
    const state = boardState({
      puck: { kind: 'carried', skaterId: 'cpu-C' },
      skaters: createInitialState(1, 'long').skaters.map((s) =>
        s.id === 'user-LW' ? { ...s, pos: { col: 8, row: 4 } } : s,
      ),
    });
    const checking = activate(state, 'user-LW');
    const duel = gameReducer(checking, { type: 'CHECK', skaterId: 'user-LW' });
    expect(duel.phase).toBe('duel');
    expect(duel.activeTeam).toBe('user');
    const result = gameReducer(
      {
        ...duel,
        phase: 'duelResult',
        duel: null,
        lastOutcome: {
          kind: 'check',
          winner: 'attacker',
          byKo: false,
          attackerId: 'user-LW',
          defenderId: 'cpu-C',
          goal: false,
          cleanSave: false,
          summary: 'check',
          receiverId: null,
        },
      },
      { type: 'DISMISS_DUEL_RESULT' },
    );
    expect(result.activeTeam).toBe('cpu');
    expect(result.activatedSkaters).toContain('user-LW');
  });

  it('skips a stunned skater for the opportunity while allowing another skater', () => {
    const state = boardState({
      activeTeam: 'cpu',
      turn: 4,
      skaters: createInitialState(1, 'long').skaters.map((s) =>
        s.id === 'cpu-C' ? { ...s, stunnedUntilTurn: 4 } : s,
      ),
    });
    expect(activate(state, 'cpu-C')).toBe(state);
    expect(activate(state, 'cpu-LW').activationSkaterId).toBe('cpu-LW');
  });

  it('forfeits remaining activations when the next team has no eligible skaters', () => {
    const state = boardState({
      activationsRemaining: { user: 2, cpu: 2 },
      activatedSkaters: ['cpu-LW', 'cpu-C', 'cpu-RW', 'cpu-LD', 'cpu-RD'],
      activationSkaterId: 'user-C',
    });
    const next = gameReducer(state, { type: 'END_ACTIVATION' });
    expect(next.activeTeam).toBe('user');
    expect(next.activationsRemaining).toEqual({ user: 1, cpu: 0 });
  });

  it('grants the defenseman third step only while the full path stays in their defensive zone', () => {
    const defenseman = createInitialState(1, 'long').skaters.find(
      (s) => s.id === 'user-LD',
    )!;
    let state = activate(
      boardState({ skaters: [{ ...defenseman, pos: { col: 3, row: 3 } }] }),
      'user-LD',
    );
    expect(state.movementRemaining).toBe(3);
    state = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-LD',
      to: { col: 4, row: 3 },
    });
    state = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-LD',
      to: { col: 3, row: 3 },
    });
    state = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-LD',
      to: { col: 4, row: 3 },
    });
    expect(state.movementRemaining).toBe(0);

    state = activate(
      boardState({ skaters: [{ ...defenseman, pos: { col: 4, row: 3 } }] }),
      'user-LD',
    );
    state = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-LD',
      to: { col: 5, row: 3 },
    });
    expect(state.movementRemaining).toBe(1);
  });

  it('resets activations and eligibility on a covered-save stoppage', () => {
    const state = boardState({
      phase: 'duelResult',
      activeTeam: 'cpu',
      activationsRemaining: { user: 1, cpu: 2 },
      activatedSkaters: ['user-C', 'cpu-C'],
      lastOutcome: {
        kind: 'shot',
        winner: 'defender',
        byKo: false,
        attackerId: 'user-C',
        defenderId: 'cpu-G',
        goal: false,
        cleanSave: true,
        summary: 'save',
        receiverId: null,
      },
      lastShotSaveResult: {
        band: 'good',
        saved: true,
        saveChance: 50,
        poiseDrain: 0,
        freeze: false,
        rebound: false,
        covered: true,
      },
    });
    const next = gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    expect(next.phase).toBe('faceoff');
    expect(next.activationsRemaining).toEqual({ user: 3, cpu: 3 });
    expect(next.activatedSkaters).toEqual([]);
    expect(next.whistle).toBe(true);

    const faceoff = gameReducer(next, { type: 'START_FACEOFF' });
    const restarted = gameReducer(
      {
        ...faceoff,
        phase: 'duelResult',
        duel: null,
        lastOutcome: {
          kind: 'faceoff',
          winner: 'attacker',
          byKo: false,
          attackerId: 'cpu-C',
          defenderId: 'user-C',
          goal: false,
          cleanSave: false,
          summary: 'faceoff',
          receiverId: null,
        },
      },
      { type: 'DISMISS_DUEL_RESULT' },
    );
    expect(restarted.phase).toBe('move');
    expect(restarted.activeTeam).toBe('cpu');
    expect(restarted.initiativeTeam).toBe('cpu');
    expect(restarted.activationsRemaining).toEqual({ user: 3, cpu: 3 });
    expect(restarted.activatedSkaters).toEqual([]);
  });

  it('preserves the boxed-in carrier whistle and board reset', () => {
    const initial = createInitialState(1, 'long');
    const state = boardState({
      activeTeam: 'cpu',
      turn: 5,
      activationSkaterId: 'cpu-C',
      skaters: initial.skaters.map((s) => {
        if (s.id === 'user-C') return { ...s, pos: { col: 7, row: 3 } };
        if (s.id === 'cpu-LD') return { ...s, pos: { col: 6, row: 3 } };
        if (s.id === 'cpu-LW') return { ...s, pos: { col: 7, row: 4 } };
        if (s.id === 'cpu-RW') return { ...s, pos: { col: 7, row: 2 } };
        return s;
      }),
      puck: { kind: 'carried', skaterId: 'user-C' },
    });
    const next = gameReducer(state, { type: 'END_ACTIVATION' });
    expect(next.phase).toBe('faceoff');
    expect(next.whistle).toBe(true);
    expect(next.puck).toEqual({ kind: 'loose', pos: { col: 7, row: 3 } });
    expect(next.skaters.find((s) => s.id === 'user-C')?.pos).toEqual({
      col: 6,
      row: 3,
    });
    expect(next.activationsRemaining).toEqual({ user: 3, cpu: 3 });
    expect(next.activatedSkaters).toEqual([]);
  });
});
