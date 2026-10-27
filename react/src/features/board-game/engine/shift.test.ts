import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import { startShift } from '@/features/board-game/engine/shift';
import type { Action, GameState } from '@/features/board-game/types/game';

const END: Action = { type: 'END_ACTIVATION' };

/** A fresh opening shift with the user holding initiative. */
function openingShift(overrides: Partial<GameState> = {}): GameState {
  return { ...startShift(createInitialState(1, 'long'), 'user'), ...overrides };
}

function run(state: GameState, actions: Action[]): GameState {
  return actions.reduce(gameReducer, state);
}

describe('alternating shifts', () => {
  it('teams strictly alternate three activations each, then the other team opens the next shift', () => {
    let state = openingShift();
    const order: string[] = [];
    for (let i = 0; i < 6; i++) {
      order.push(state.activeTeam);
      state = gameReducer(state, END);
    }
    expect(order).toEqual(['user', 'cpu', 'user', 'cpu', 'user', 'cpu']);
    expect(state.shift).toBe(2);
    expect(state.initiative).toBe('cpu');
    expect(state.activeTeam).toBe('cpu');
    expect(state.activationsLeft).toEqual({ user: 3, cpu: 3 });

    // Initiative keeps alternating shift to shift.
    state = run(state, [END, END, END, END, END, END]);
    expect(state.shift).toBe(3);
    expect(state.initiative).toBe('user');
  });

  it('a non-goalie cannot activate twice in one shift; eligibility resets with the next shift', () => {
    const moveLw: Action = {
      type: 'MOVE',
      skaterId: 'user-LW',
      to: { col: 6, row: 0 },
    };
    let state = run(openingShift(), [moveLw, END, END]);
    expect(state.activeTeam).toBe('user');
    expect(state.activatedSkaterIds).toContain('user-LW');
    const back: Action = { ...moveLw, to: { col: 5, row: 0 } };
    expect(gameReducer(state, back)).toBe(state);

    // A goalie never activates.
    expect(
      gameReducer(state, {
        type: 'MOVE',
        skaterId: 'user-G',
        to: { col: 1, row: 3 },
      }),
    ).toBe(state);

    state = run(state, [END, END, END, END]);
    expect(state.shift).toBe(2);
    state = gameReducer(state, END); // cpu opens shift 2
    expect(gameReducer(state, back)).not.toBe(state);
  });

  it('movement then one action is legal; a second action or another skater is rejected', () => {
    // user-C carries at (9,2), one tile from the offensive zone; cpu-RD is
    // moved out of the way so no deke triggers.
    const base = openingShift({
      puck: { kind: 'carried', skaterId: 'user-C' },
    });
    const state = {
      ...base,
      skaters: base.skaters.map((s) => {
        if (s.id === 'user-C') return { ...s, pos: { col: 9, row: 2 } };
        if (s.id === 'cpu-RD') return { ...s, pos: { col: 12, row: 5 } };
        return s;
      }),
    };
    const moved = run(state, [
      { type: 'MOVE', skaterId: 'user-C', to: { col: 10, row: 2 } },
      { type: 'MOVE', skaterId: 'user-C', to: { col: 11, row: 2 } },
    ]);
    expect(moved.stepsLeft).toBe(0);
    // Out of tiles, and no one else may move during user-C's activation.
    expect(
      gameReducer(moved, {
        type: 'MOVE',
        skaterId: 'user-C',
        to: { col: 12, row: 2 },
      }),
    ).toBe(moved);
    expect(
      gameReducer(moved, {
        type: 'MOVE',
        skaterId: 'user-LW',
        to: { col: 6, row: 0 },
      }),
    ).toBe(moved);

    const shot = gameReducer(moved, { type: 'SHOOT' });
    expect(shot.phase).toBe('duel');
    expect(shot.duel!.kind).toBe('shot');
    // A second action during the battle is rejected.
    expect(gameReducer(shot, { type: 'SHOOT' })).toBe(shot);
    expect(gameReducer(shot, END)).toBe(shot);
  });

  it('a completed pass ends the activation and leaves the receiver free to activate later', () => {
    const state = run(
      openingShift({ puck: { kind: 'carried', skaterId: 'user-C' } }),
      [{ type: 'PASS', toSkaterId: 'user-RW' }],
    );
    expect(state.activeTeam).toBe('cpu');
    expect(state.activatedSkaterIds).toEqual(['user-C']);

    const back = gameReducer(state, END);
    expect(back.activeTeam).toBe('user');
    const receiverMoves = gameReducer(back, {
      type: 'MOVE',
      skaterId: 'user-RW',
      to: { col: 6, row: 6 },
    });
    expect(receiverMoves).not.toBe(back);
  });

  it('after a possession-changing battle, play resumes with the other team, and the stun lasts the rest of the shift', () => {
    // user-LW checks the cpu carrier and loses: cpu keeps the puck, user-LW is stunned.
    const base = openingShift({ puck: { kind: 'carried', skaterId: 'cpu-C' } });
    const state: GameState = {
      ...base,
      phase: 'duelResult',
      activeSkaterId: 'user-LW',
      skaters: base.skaters.map((s) =>
        s.id === 'user-LW' ? { ...s, stunned: true } : s,
      ),
      lastOutcome: {
        kind: 'check',
        winner: 'defender',
        byKo: false,
        attackerId: 'user-LW',
        defenderId: 'cpu-C',
        goal: false,
        cleanSave: false,
        summary: 'check defender wins',
        receiverId: null,
      },
    };
    let next = gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    expect(next.phase).toBe('move');
    expect(next.activeTeam).toBe('cpu');
    expect(next.activationsLeft).toEqual({ user: 2, cpu: 3 });

    next = gameReducer(next, END);
    const stunnedMove: Action = {
      type: 'MOVE',
      skaterId: 'user-LW',
      to: { col: 6, row: 0 },
    };
    expect(next.activeTeam).toBe('user');
    expect(next.skaters.find((s) => s.id === 'user-LW')!.stunned).toBe(true);
    expect(gameReducer(next, stunnedMove)).toBe(next);

    next = run(next, [END, END, END, END]);
    expect(next.shift).toBe(2);
    expect(next.skaters.some((s) => s.stunned)).toBe(false);
  });

  it('a team with activations left but no eligible skater forfeits them', () => {
    // Two user skaters already activated, the other three stunned.
    const base = openingShift({
      activeTeam: 'cpu',
      activationsLeft: { user: 1, cpu: 2 },
      activatedSkaterIds: ['user-C', 'user-LW'],
    });
    const state = {
      ...base,
      skaters: base.skaters.map((s) =>
        ['user-RW', 'user-LD', 'user-RD'].includes(s.id)
          ? { ...s, stunned: true }
          : s,
      ),
    };
    const next = gameReducer(state, END);
    expect(next.activeTeam).toBe('cpu');
    expect(next.activationsLeft).toEqual({ user: 0, cpu: 1 });

    // The cpu's last activation ends the shift; the cpu went second this shift, so it opens the next.
    const reset = gameReducer(next, END);
    expect(reset.shift).toBe(2);
    expect(reset.initiative).toBe('cpu');
  });
});
