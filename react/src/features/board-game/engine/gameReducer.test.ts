import { describe, expect, it } from 'vitest';
import { FACEOFF_SPOTS } from '@/features/board-game/data/rink';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import { MOVE_ALLOWANCE } from '@/features/board-game/data/balance';
import type { GameState } from '@/features/board-game/types/game';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(1, 'long'),
    phase: 'move',
    activeTeam: 'user',
    ...overrides,
  };
}

describe('createInitialState', () => {
  it('sets formations, a loose center puck, the opening faceoff, and any streak bonus', () => {
    const state = createInitialState(1, 'long');
    expect(state.phase).toBe('faceoff');
    expect(state.bonusEnergy).toBe(0);
    expect(state.activeTeam).toBe('user');
    expect(state.shift).toBe(0);
    expect(state.puck).toEqual({ kind: 'loose', pos: { col: 7, row: 3 } });
    expect(state.skaters.find((s) => s.id === 'user-C')?.pos).toEqual({
      col: 6,
      row: 3,
    });
    expect(state.skaters).toHaveLength(12);

    // Accepts a daily-streak bonus at game creation.
    expect(createInitialState(1, 'long', 1).bonusEnergy).toBe(1);
  });
});

describe('START_FACEOFF', () => {
  it('starts the faceoff only in its phase', () => {
    const state = createInitialState(1, 'long');
    const next = gameReducer(state, { type: 'START_FACEOFF' });
    expect(next.phase).toBe('duel');
    expect(next.duel!.kind).toBe('faceoff');

    const illegal = gameReducer(next, { type: 'START_FACEOFF' });
    expect(illegal).toBe(next);
  });
});

describe('MOVE', () => {
  it('stays within the allowance, blocks occupied tiles, and collecting a loose puck ends the activation', () => {
    const state = makeState({ stepsLeft: 0 });
    const next = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'user-C',
      to: { col: 7, row: 3 },
    });
    expect(next).toBe(state);

    // Blocks a move onto an occupied tile.
    {
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
    }

    // A plain move spends one tile and makes the mover the activation's skater.
    {
      const next = gameReducer(makeState(), {
        type: 'MOVE',
        skaterId: 'user-C',
        to: { col: 6, row: 4 },
      });
      expect(next.stepsLeft).toBe(1);
      expect(next.activeSkaterId).toBe('user-C');
      expect(next.activeTeam).toBe('user');
    }

    // Collecting the loose puck is the action: the activation ends.
    {
      const state = makeState({
        puck: { kind: 'loose', pos: { col: 6, row: 4 } },
      });
      const next = gameReducer(state, {
        type: 'MOVE',
        skaterId: 'user-C',
        to: { col: 6, row: 4 },
      });
      expect(next.puck).toEqual({ kind: 'carried', skaterId: 'user-C' });
      expect(next.activatedSkaterIds).toEqual(['user-C']);
      expect(next.activeTeam).toBe('cpu');
    }
  });

  it('deke triggers pick the defender in role order, skipping stunned opponents', () => {
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

    // A stunned qualifying opponent does not trigger the deke duel.
    {
      const state = makeState();
      const skaters = state.skaters.map((s) =>
        s.id === 'cpu-C' ? { ...s, pos: { col: 8, row: 3 }, stunned: true } : s,
      );
      const next = gameReducer(
        { ...state, skaters },
        { type: 'MOVE', skaterId: 'user-C', to: { col: 7, row: 3 } },
      );
      expect(next.phase).toBe('move');
      expect(next.duel).toBeNull();
    }
  });
});

describe('PASS (passTargets)', () => {
  it('passes complete when clear, else start an intercept against the nearest opponent', () => {
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
    expect(next.activeSkaterId).toBe('user-C');

    // Completes the pass when the lane is clear.
    {
      const state = makeState({
        puck: { kind: 'carried', skaterId: 'user-C' },
      });
      const next = gameReducer(state, { type: 'PASS', toSkaterId: 'user-RW' });
      expect(next.puck).toEqual({ kind: 'carried', skaterId: 'user-RW' });
      expect(next.duel).toBeNull();
      // The pass ends the passer's activation; the receiver is not activated.
      expect(next.activatedSkaterIds).toEqual(['user-C']);
      expect(next.activeTeam).toBe('cpu');
    }
  });
});

describe('SHOOT (canShoot)', () => {
  it('shots are legal only in the offensive zone, starting a duel with the goalie', () => {
    const state = makeState({ puck: { kind: 'carried', skaterId: 'user-C' } }); // col 6, not >= 10
    const next = gameReducer(state, { type: 'SHOOT' });
    expect(next).toBe(state);

    // Starts a shot duel against the opposing goalie inside the zone.
    {
      const state = makeState();
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
    }
  });
});

describe('CHECK (checkTargets)', () => {
  it('checks start a duel only when adjacent to the enemy carrier', () => {
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

    // Is illegal when not adjacent to the enemy carrier.
    {
      const state = makeState({ puck: { kind: 'carried', skaterId: 'cpu-C' } });
      const next = gameReducer(state, { type: 'CHECK', skaterId: 'user-LW' });
      expect(next).toBe(state);
    }
  });
});

describe('END_ACTIVATION (canEndActivation)', () => {
  it('is legal only in the move phase and hands the next activation over', () => {
    const illegal = makeState({ phase: 'duel' });
    expect(gameReducer(illegal, { type: 'END_ACTIVATION' })).toBe(illegal);

    // Holding position spends an activation without activating a skater.
    const held = gameReducer(makeState(), { type: 'END_ACTIVATION' });
    expect(held.activeTeam).toBe('cpu');
    expect(held.activationsLeft).toEqual({ user: 2, cpu: 3 });
    expect(held.activatedSkaterIds).toEqual([]);

    // After moving, ending records the mover as activated.
    const moved = gameReducer(makeState(), {
      type: 'MOVE',
      skaterId: 'user-LW',
      to: { col: 6, row: 0 },
    });
    const ended = gameReducer(moved, { type: 'END_ACTIVATION' });
    expect(ended.activatedSkaterIds).toEqual(['user-LW']);
    expect(ended.activeSkaterId).toBeNull();
    expect(ended.stepsLeft).toBe(MOVE_ALLOWANCE);
  });
});

describe('Whistle (isBoxedIn)', () => {
  it('a boxed-in carrier is whistled and reset; a free neighbor avoids it; START_FACEOFF clears it', () => {
    const base = makeState({ activeTeam: 'cpu' });
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
    const next = gameReducer(state, { type: 'END_ACTIVATION' });
    expect(next.phase).toBe('faceoff');
    expect(next.whistle).toBe(true);
    expect(next.puck).toEqual({ kind: 'loose', pos: { col: 7, row: 3 } });
    expect(next.skaters.find((s) => s.id === 'user-C')!.pos).toEqual({
      col: 6,
      row: 3,
    });

    // Does not reset when the carrier still has a free neighbor to step to.
    {
      const state = makeState({
        activeTeam: 'cpu',
        puck: { kind: 'carried', skaterId: 'user-C' },
      });
      const next = gameReducer(state, { type: 'END_ACTIVATION' });
      expect(next.whistle).toBe(false);
      expect(next.phase).toBe('move');
    }

    // START_FACEOFF clears whistle.
    {
      const state = makeState({ phase: 'faceoff', whistle: true });
      const next = gameReducer(state, { type: 'START_FACEOFF' });
      expect(next.whistle).toBe(false);
    }
  });
});

describe('DISMISS_DUEL_RESULT', () => {
  it('after a faceoff opens a shift for the winner; any other battle ends the activation', () => {
    const state = makeState({
      phase: 'duelResult',
      shift: 1,
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
    });
    const next = gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    expect(next.phase).toBe('move');
    expect(next.activeTeam).toBe('cpu');
    expect(next.initiative).toBe('cpu');
    expect(next.shift).toBe(2);
    expect(next.activationsLeft).toEqual({ user: 3, cpu: 3 });

    // A check battle used the checker's action: its activation ends.
    {
      const state = makeState({
        phase: 'duelResult',
        activeSkaterId: 'user-LW',
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
      expect(next.activatedSkaterIds).toEqual(['user-LW']);
      expect(next.activeTeam).toBe('cpu');
    }
  });

  it('a rebound save returns to move; a covered save whistles to the covering end-zone dot', () => {
    const state = makeState({
      phase: 'duelResult',
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

    // A covered save (BG-A16/BG-A15b) whistles dead and routes to the end-zone dot in front of the covering net, moving only the two centres.
    {
      const movedSkaters = createInitialState(1, 'long').skaters.map((s) =>
        s.id === 'cpu-LD' ? { ...s, pos: { col: 5, row: 5 } } : s,
      );
      const state = makeState({
        phase: 'duelResult',
        activeTeam: 'cpu',
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
    }
  });
});

describe('illegal actions and gameOver', () => {
  it('ignores unknown skaters and allows only NEW_GAME once the game is over', () => {
    const state = makeState();
    const next = gameReducer(state, {
      type: 'MOVE',
      skaterId: 'nope',
      to: { col: 7, row: 3 },
    });
    expect(next).toBe(state);

    // Only NEW_GAME is legal once the game is over.
    {
      const state = makeState({ phase: 'gameOver', winner: 'user' });
      const next = gameReducer(state, { type: 'END_ACTIVATION' });
      expect(next).toBe(state);
      const fresh = gameReducer(state, {
        type: 'NEW_GAME',
        seed: 5,
        length: 'short',
        bonusEnergy: 1,
      });
      expect(fresh.phase).toBe('faceoff');
      expect(fresh.length).toBe('short');
      expect(fresh.bonusEnergy).toBe(1);
    }
  });
});

describe('seeded replay', () => {
  it('the same seed and action list give a deep-equal final state', () => {
    const run = () => {
      let state = createInitialState(42, 'long');
      state = gameReducer(state, { type: 'END_ACTIVATION' }); // illegal (phase faceoff), no-op
      state = gameReducer(state, { type: 'START_FACEOFF' });
      return state;
    };
    expect(run()).toEqual(run());
  });
});
