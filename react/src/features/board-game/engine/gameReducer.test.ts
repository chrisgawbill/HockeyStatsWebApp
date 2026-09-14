import { describe, expect, it } from 'vitest';
import { FACEOFF_SPOTS } from '@/features/board-game/data/rink';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import type { GameState } from '@/features/board-game/types/game';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(1, 'long'),
    phase: 'move',
    activeTeam: 'user',
    mp: 3,
    ...overrides,
  };
}

describe('createInitialState', () => {
  it('sets formations, a loose center puck, and the opening faceoff phase', () => {
    const state = createInitialState(1, 'long');
    expect(state.phase).toBe('faceoff');
    expect(state.activeTeam).toBe('user');
    expect(state.turn).toBe(1);
    expect(state.puck).toEqual({ kind: 'loose', pos: { col: 7, row: 3 } });
    expect(state.skaters.find((s) => s.id === 'user-C')?.pos).toEqual({
      col: 6,
      row: 3,
    });
    expect(state.skaters).toHaveLength(12);
  });
});

describe('START_FACEOFF / ROLL_DICE (canRoll)', () => {
  it('starts the faceoff duel only in the faceoff phase', () => {
    const state = createInitialState(1, 'long');
    const next = gameReducer(state, { type: 'START_FACEOFF' });
    expect(next.phase).toBe('duel');
    expect(next.duel!.kind).toBe('faceoff');

    const illegal = gameReducer(next, { type: 'START_FACEOFF' });
    expect(illegal).toBe(next);
  });

  it('rolls 2d6 deterministically for a seed and is only legal in the roll phase', () => {
    const state = makeState({ phase: 'roll', mp: 0, dice: null });
    const rolled = gameReducer(state, { type: 'ROLL_DICE' });
    expect(rolled.phase).toBe('move');
    expect(rolled.dice).not.toBeNull();
    const [d1, d2] = rolled.dice!;
    expect(rolled.mp).toBe(d1 + d2);

    // same seed, same result
    const again = gameReducer(state, { type: 'ROLL_DICE' });
    expect(again.dice).toEqual(rolled.dice);

    const illegal = gameReducer(rolled, { type: 'ROLL_DICE' });
    expect(illegal).toBe(rolled);
  });
});

describe('MOVE', () => {
  it('cannot overspend MP', () => {
    const state = makeState({ mp: 0 });
    const next = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-C',
      to: { col: 7, row: 3 },
    });
    expect(next).toBe(state);
  });

  it('blocks a move onto an occupied tile', () => {
    const state = makeState();
    // user-LW starts at (6,1); moving user-C (6,3) there directly isn't adjacent, so use a real neighbor:
    // put a blocker directly next to user-C's start.
    const skaters = state.skaters.map((s) =>
      s.id === 'cpu-C' ? { ...s, pos: { col: 7, row: 3 } } : s,
    );
    const blocked = { ...state, skaters };
    const next = gameReducer(blocked, {
      type: 'MOVE',
      skaterId: 'user-C',
      to: { col: 7, row: 3 },
    });
    expect(next).toBe(blocked);
  });

  it('picks up a loose puck on arrival and spends 1 MP', () => {
    const state = makeState({ mp: 3 });
    const next = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-C',
      to: { col: 7, row: 3 },
    });
    expect(next.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
    expect(next.mp).toBe(2);
  });

  it('the deke trigger picks the defender in role order (C, LW, RW, LD, RD)', () => {
    // Move user-C onto the puck at (7,3); put a cpu LW and cpu C both adjacent at (7,3)'s neighbors.
    const state = makeState();
    const skaters = state.skaters.map((s) => {
      if (s.id === 'cpu-LW') return { ...s, pos: { col: 7, row: 4 } };
      if (s.id === 'cpu-C') return { ...s, pos: { col: 8, row: 3 } };
      return s;
    });
    const next = gameReducer(
      { ...state, skaters },
      { type: 'MOVE', skaterId: 'user-C', to: { col: 7, row: 3 } },
    );
    expect(next.phase).toBe('duel');
    expect(next.duel!.kind).toBe('deke');
    expect(next.duel!.defender.skaterId).toBe('cpu-C');
  });

  it('a stunned qualifying opponent does not trigger the deke duel', () => {
    const state = makeState();
    const skaters = state.skaters.map((s) =>
      s.id === 'cpu-C'
        ? { ...s, pos: { col: 8, row: 3 }, stunnedUntilTurn: 99 }
        : s,
    );
    const next = gameReducer(
      { ...state, skaters },
      { type: 'MOVE', skaterId: 'user-C', to: { col: 7, row: 3 } },
    );
    expect(next.phase).toBe('move');
    expect(next.duel).toBeNull();
  });
});

describe('PASS (passTargets)', () => {
  it('starts an intercept duel against the nearest non-stunned opponent in the lane', () => {
    const state = makeState({ puck: { kind: 'carried', skaterId: 'user-C' } });
    // user-C at (6,3), user-RW at (6,5); put a cpu skater between them in the lane at (6,4).
    const skaters = state.skaters.map((s) =>
      s.id === 'cpu-LD' ? { ...s, pos: { col: 6, row: 4 } } : s,
    );
    const next = gameReducer(
      { ...state, skaters },
      { type: 'PASS', toSkaterId: 'user-RW' },
    );
    expect(next.phase).toBe('duel');
    expect(next.duel!.kind).toBe('intercept');
    expect(next.duel!.defender.skaterId).toBe('cpu-LD');
    expect(next.duel!.receiverId).toBe('user-RW');
    expect(next.mp).toBe(1); // 3 - COST.pass(2)
  });

  it('completes the pass when the lane is clear', () => {
    const state = makeState({ puck: { kind: 'carried', skaterId: 'user-C' } });
    const next = gameReducer(state, { type: 'PASS', toSkaterId: 'user-RW' });
    expect(next.puck).toEqual({ kind: 'carried', skaterId: 'user-RW' });
    expect(next.duel).toBeNull();
  });
});

describe('SHOOT (canShoot)', () => {
  it('is illegal outside the offensive zone', () => {
    const state = makeState({ puck: { kind: 'carried', skaterId: 'user-C' } }); // col 6, not >= 10
    const next = gameReducer(state, { type: 'SHOOT' });
    expect(next).toBe(state);
  });

  it('starts a shot duel against the opposing goalie inside the zone', () => {
    const state = makeState({ mp: 3 });
    const skaters = state.skaters.map((s) =>
      s.id === 'user-C' ? { ...s, pos: { col: 11, row: 3 } } : s,
    );
    const next = gameReducer(
      { ...state, skaters, puck: { kind: 'carried', skaterId: 'user-C' } },
      { type: 'SHOOT' },
    );
    expect(next.phase).toBe('duel');
    expect(next.duel!.kind).toBe('shot');
    expect(next.duel!.defender.skaterId).toBe('cpu-G');
  });
});

describe('CHECK (checkTargets)', () => {
  it('starts a check duel when adjacent to the enemy carrier', () => {
    const state = makeState({ puck: { kind: 'carried', skaterId: 'cpu-C' } });
    // cpu-C at (8,3); user-C at (6,3) is not adjacent, move a user skater next to it.
    const skaters = state.skaters.map((s) =>
      s.id === 'user-LW' ? { ...s, pos: { col: 8, row: 4 } } : s,
    );
    const next = gameReducer(
      { ...state, skaters },
      { type: 'CHECK', skaterId: 'user-LW' },
    );
    expect(next.phase).toBe('duel');
    expect(next.duel!.kind).toBe('check');
    expect(next.duel!.attacker.skaterId).toBe('user-LW');
    expect(next.duel!.defender.skaterId).toBe('cpu-C');
  });

  it('is illegal when not adjacent to the enemy carrier', () => {
    const state = makeState({ puck: { kind: 'carried', skaterId: 'cpu-C' } });
    const next = gameReducer(state, { type: 'CHECK', skaterId: 'user-LW' });
    expect(next).toBe(state);
  });
});

describe('END_TURN (canEndTurn)', () => {
  it('is legal only in the move phase, switches team and clears expired stuns', () => {
    const illegal = gameReducer(makeState({ phase: 'roll' }), {
      type: 'END_TURN',
    });
    expect(illegal.phase).toBe('roll');

    const state = makeState({ turn: 3, activeTeam: 'user' });
    const skaters = state.skaters.map((s) =>
      s.id === 'user-LW' ? { ...s, stunnedUntilTurn: 4 } : s,
    );
    const next = gameReducer({ ...state, skaters }, { type: 'END_TURN' });
    expect(next.turn).toBe(4);
    expect(next.activeTeam).toBe('cpu');
    expect(next.phase).toBe('roll');
    expect(next.mp).toBe(0);
    expect(next.dice).toBeNull();
    expect(next.actionsThisTurn).toBe(0);
    // stunnedUntilTurn (4) is not yet < new turn (4), so still stunned
    expect(next.skaters.find((s) => s.id === 'user-LW')!.stunnedUntilTurn).toBe(
      4,
    );

    const laterTurn = gameReducer(
      { ...next, phase: 'move' },
      { type: 'END_TURN' },
    );
    expect(
      laterTurn.skaters.find((s) => s.id === 'user-LW')!.stunnedUntilTurn,
    ).toBeNull();
  });
});

describe('Whistle (isBoxedIn)', () => {
  it('resets the board on END_TURN when the puck carrier ends up boxed in', () => {
    const base = makeState({ activeTeam: 'cpu', turn: 5 });
    const skaters = base.skaters.map((s) => {
      if (s.id === 'user-C') return { ...s, pos: { col: 7, row: 3 } };
      if (s.id === 'cpu-LD') return { ...s, pos: { col: 6, row: 3 } };
      if (s.id === 'cpu-LW') return { ...s, pos: { col: 7, row: 4 } };
      if (s.id === 'cpu-RW') return { ...s, pos: { col: 7, row: 2 } };
      return s;
    });
    const state = {
      ...base,
      skaters,
      puck: { kind: 'carried' as const, skaterId: 'user-C' },
    };
    const next = gameReducer(state, { type: 'END_TURN' });
    expect(next.phase).toBe('faceoff');
    expect(next.activeTeam).toBe('user');
    expect(next.whistle).toBe(true);
    expect(next.puck).toEqual({ kind: 'loose', pos: { col: 7, row: 3 } });
    expect(next.mp).toBe(0);
    expect(next.dice).toBeNull();
    expect(next.turn).toBe(6); // the turn still increments
    expect(next.skaters.find((s) => s.id === 'user-C')!.pos).toEqual({
      col: 6,
      row: 3,
    });
  });

  it('does not reset when the carrier still has a free neighbor to step to', () => {
    const state = makeState({
      activeTeam: 'cpu',
      turn: 5,
      puck: { kind: 'carried', skaterId: 'user-C' },
    });
    const next = gameReducer(state, { type: 'END_TURN' });
    expect(next.whistle).toBe(false);
    expect(next.phase).toBe('roll');
  });

  it('START_FACEOFF clears whistle', () => {
    const state = makeState({ phase: 'faceoff', whistle: true });
    const next = gameReducer(state, { type: 'START_FACEOFF' });
    expect(next.whistle).toBe(false);
  });
});

describe('DISMISS_DUEL_RESULT', () => {
  it('after a faceoff, hands the roll to the winner at turn 1 with mp/dice reset', () => {
    const state = makeState({
      phase: 'duelResult',
      turn: 1,
      lastOutcome: {
        kind: 'faceoff',
        winner: 'defender',
        byKo: false,
        attackerId: 'user-C',
        defenderId: 'cpu-C',
        goal: false,
        cleanSave: false,
        summary: 'faceoff defender wins',
        receiverId: null,
      },
      mp: 5,
      dice: [2, 3],
    });
    const next = gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    expect(next.phase).toBe('roll');
    expect(next.activeTeam).toBe('cpu');
    expect(next.mp).toBe(0);
    expect(next.dice).toBeNull();
    expect(next.turn).toBe(1);
  });

  it('otherwise returns to move and keeps remaining MP', () => {
    const state = makeState({
      phase: 'duelResult',
      mp: 2,
      lastOutcome: {
        kind: 'check',
        winner: 'attacker',
        byKo: true,
        attackerId: 'user-LW',
        defenderId: 'cpu-C',
        goal: false,
        cleanSave: false,
        summary: 'check attacker wins',
        receiverId: null,
      },
    });
    const next = gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    expect(next.phase).toBe('move');
    expect(next.mp).toBe(2);
  });

  it('a rebound (not covered) shot save returns to move, not faceoff', () => {
    const state = makeState({
      phase: 'duelResult',
      mp: 1,
      lastOutcome: {
        kind: 'shot',
        winner: 'defender',
        byKo: false,
        attackerId: 'user-C',
        defenderId: 'cpu-G',
        goal: false,
        cleanSave: false,
        summary: 'shot defender wins',
        receiverId: null,
      },
      lastShotSaveResult: {
        band: 'good',
        saved: true,
        saveChance: 48,
        poiseDrain: 5,
        freeze: false,
        rebound: true,
        covered: false,
      },
    });
    const next = gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    expect(next.phase).toBe('move');
    expect(next.whistle).toBe(false);
  });

  it('a covered save (BG-A16/BG-A15b) whistles dead and routes to the end-zone dot in front of the covering net, moving only the two centres', () => {
    const movedSkaters = createInitialState(1, 'long').skaters.map((s) =>
      s.id === 'cpu-LD' ? { ...s, pos: { col: 5, row: 5 } } : s,
    );
    const state = makeState({
      phase: 'duelResult',
      activeTeam: 'cpu',
      mp: 1,
      skaters: movedSkaters,
      lastOutcome: {
        kind: 'shot',
        winner: 'defender',
        byKo: false,
        attackerId: 'user-C',
        defenderId: 'cpu-G',
        goal: false,
        cleanSave: false,
        summary: 'shot defender wins',
        receiverId: null,
      },
      lastShotSaveResult: {
        band: 'perfect',
        saved: true,
        saveChance: 20,
        poiseDrain: 5,
        freeze: false,
        rebound: false,
        covered: true,
      },
    });
    const next = gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    expect(next.phase).toBe('faceoff');
    expect(next.whistle).toBe(true);
    expect(next.mp).toBe(0);
    expect(next.dice).toBeNull();
    expect(next.lastOutcome).toBeNull();
    expect(next.lastShotSaveResult).toBeNull();

    // cpu-G made the save, so the draw routes to one of cpu's own two
    // defending dots - not the old interim centre-ice path.
    const dot = next.faceoffSpot;
    expect(FACEOFF_SPOTS.defendingDots.cpu).toContainEqual(dot);
    expect(next.puck).toEqual({ kind: 'loose', pos: dot });

    // Only the two centres move to the dot; a skater elsewhere on the ice
    // stays exactly where it was - unlike the boxed-in-carrier whistle
    // above, this is not a full formation reset.
    expect(next.skaters.find((s) => s.id === 'user-C')!.pos).toEqual(dot);
    expect(next.skaters.find((s) => s.id === 'cpu-C')!.pos).toEqual(dot);
    expect(next.skaters.find((s) => s.id === 'cpu-LD')!.pos).toEqual({
      col: 5,
      row: 5,
    });
  });
});

describe('illegal actions and gameOver', () => {
  it('returns the same reference for an unknown skater id', () => {
    const state = makeState();
    const next = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'nope',
      to: { col: 7, row: 3 },
    });
    expect(next).toBe(state);
  });

  it('only NEW_GAME is legal once the game is over', () => {
    const state = makeState({ phase: 'gameOver', winner: 'user' });
    const next = gameReducer(state, { type: 'END_TURN' });
    expect(next).toBe(state);
    const fresh = gameReducer(state, {
      type: 'NEW_GAME',
      seed: 5,
      length: 'short',
    });
    expect(fresh.phase).toBe('faceoff');
    expect(fresh.length).toBe('short');
  });
});

describe('seeded replay', () => {
  it('the same seed and action list give a deep-equal final state', () => {
    const run = () => {
      let state = createInitialState(42, 'long');
      state = gameReducer(state, { type: 'ROLL_DICE' }); // illegal (phase faceoff), no-op
      state = gameReducer(state, { type: 'START_FACEOFF' });
      return state;
    };
    expect(run()).toEqual(run());
  });
});
