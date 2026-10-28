import { MOVE_ALLOWANCE } from '@/features/board-game/data/balance';
import { FACEOFF_SPOTS } from '@/features/board-game/data/rink';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import { legalSteps, stepsRemaining } from '@/features/board-game/engine/rink';
import { isBoxedIn, passTargets } from '@/features/board-game/engine/selectors';
import type { GameState, Skater } from '@/features/board-game/types/game';
import { makeMoveState as makeState } from '@/test/fixtures/boardScenarios';
import { describe, expect, it } from 'vitest';

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
        screenPenalty: 0,
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
          screenPenalty: 0,
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

describe('Diagonal skating and pass lanes (ON2-02)', () => {
  function skater(id: string, col: number, row: number): Skater {
    const [team, role] = id.split('-') as [Skater['team'], Skater['role']];
    return { id, team, role, pos: { col, row }, stunned: false };
  }

  function move(state: GameState, skaterId: string, col: number, row: number) {
    return gameReducer(state, { type: 'MOVE', skaterId, to: { col, row } });
  }

  it('steps in eight directions; a diagonal is blocked by an unplayable side or two occupied sides', () => {
    const open = makeState({ skaters: [skater('user-C', 5, 3)] });
    expect(legalSteps(open, 'user-C')).toHaveLength(8);

    // One occupied side: skating past is fine.
    const onePlayer = makeState({
      skaters: [skater('user-C', 5, 3), skater('cpu-C', 6, 3)],
    });
    expect(legalSteps(onePlayer, 'user-C')).toContainEqual({ col: 6, row: 2 });

    // Two occupied sides: no squeezing between them.
    const twoPlayers = makeState({
      skaters: [
        skater('user-C', 5, 3),
        skater('cpu-C', 6, 3),
        skater('user-LW', 5, 2),
      ],
    });
    expect(legalSteps(twoPlayers, 'user-C')).not.toContainEqual({
      col: 6,
      row: 2,
    });

    // An unplayable board-corner side blocks the cut.
    const corner = makeState({ skaters: [skater('user-C', 1, 1)] });
    const cornerSteps = legalSteps(corner, 'user-C');
    expect(cornerSteps).not.toContainEqual({ col: 0, row: 2 });
    expect(cornerSteps).not.toContainEqual({ col: 2, row: 0 });
    expect(cornerSteps).toContainEqual({ col: 2, row: 2 });
  });

  it('a diagonal neighbour pressures the carrier (deke) and can be checked', () => {
    const state = makeState({
      skaters: [skater('user-C', 5, 3), skater('cpu-RD', 7, 1)],
      puck: { kind: 'carried', skaterId: 'user-C' },
    });
    const deked = move(state, 'user-C', 6, 2);
    expect(deked.duel!.kind).toBe('deke');
    expect(deked.duel!.defender.skaterId).toBe('cpu-RD');

    const checkState = makeState({
      skaters: [skater('cpu-C', 8, 3), skater('user-LW', 7, 2)],
      puck: { kind: 'carried', skaterId: 'cpu-C' },
    });
    const checked = gameReducer(checkState, {
      type: 'CHECK',
      skaterId: 'user-LW',
    });
    expect(checked.duel!.kind).toBe('check');
  });

  it('a defenseman gets a third tile only while start, path and end stay in its defensive zone', () => {
    // User defends cols 0-4: (2,2) -> (3,3) -> (4,4) -> third tile in zone only.
    let state = makeState({ skaters: [skater('user-LD', 2, 2)] });
    expect(stepsRemaining(state, 'user-LD')).toBe(3);
    state = move(move(state, 'user-LD', 3, 3), 'user-LD', 4, 4);
    const thirdTiles = legalSteps(state, 'user-LD');
    expect(thirdTiles.length).toBeGreaterThan(0);
    expect(thirdTiles.every((c) => c.col <= 4)).toBe(true);
    state = move(state, 'user-LD', 4, 5);
    expect(state.skaters[0].pos).toEqual({ col: 4, row: 5 });
    expect(legalSteps(state, 'user-LD')).toEqual([]);

    // Touching col 5 ends the range, even back in the zone.
    let outAndBack = makeState({ skaters: [skater('user-LD', 4, 2)] });
    outAndBack = move(move(outAndBack, 'user-LD', 5, 2), 'user-LD', 4, 3);
    expect(stepsRemaining(outAndBack, 'user-LD')).toBe(0);

    // Starting outside the zone: two tiles, even skating back in.
    let fromNeutral = makeState({ skaters: [skater('user-LD', 5, 2)] });
    fromNeutral = move(move(fromNeutral, 'user-LD', 4, 3), 'user-LD', 3, 4);
    expect(legalSteps(fromNeutral, 'user-LD')).toEqual([]);

    // Forwards never get it; the CPU defends cols 10-14 the same way.
    const forward = makeState({ skaters: [skater('user-C', 2, 2)] });
    expect(stepsRemaining(forward, 'user-C')).toBe(2);
    const cpuDefense = makeState({
      activeTeam: 'cpu',
      skaters: [skater('cpu-LD', 12, 2)],
    });
    expect(stepsRemaining(cpuDefense, 'cpu-LD')).toBe(3);
  });

  it('passes along straight diagonals; only an opponent on the lane intercepts', () => {
    const carrier = skater('user-C', 4, 2);
    const receiver = skater('user-RW', 7, 5);
    const beside = makeState({
      skaters: [carrier, receiver, skater('cpu-C', 5, 2)],
      puck: { kind: 'carried', skaterId: 'user-C' },
    });
    expect(
      gameReducer(beside, { type: 'PASS', toSkaterId: 'user-RW' }).puck,
    ).toEqual({ kind: 'carried', skaterId: 'user-RW' });

    const onLane = makeState({
      skaters: [carrier, receiver, skater('cpu-C', 6, 4)],
      puck: { kind: 'carried', skaterId: 'user-C' },
    });
    const intercepted = gameReducer(onLane, {
      type: 'PASS',
      toSkaterId: 'user-RW',
    });
    expect(intercepted.duel!.kind).toBe('intercept');

    // A diagonal neighbour is a handoff, not a pass.
    const neighbour = makeState({
      skaters: [carrier, skater('user-LW', 5, 3)],
      puck: { kind: 'carried', skaterId: 'user-C' },
    });
    expect(passTargets(neighbour)).toEqual([]);
  });

  it('a carrier boxed in on all four sides escapes the whistle with a diagonal pass receiver', () => {
    const boxIn = [
      skater('cpu-LD', 6, 3),
      skater('cpu-LW', 7, 4),
      skater('cpu-RW', 7, 2),
      skater('cpu-C', 8, 3),
    ];
    const boxed = makeState({
      activeTeam: 'cpu',
      skaters: [skater('user-C', 7, 3), ...boxIn],
      puck: { kind: 'carried', skaterId: 'user-C' },
    });
    expect(isBoxedIn(boxed, 'user-C')).toBe(true);

    const withReceiver = {
      ...boxed,
      skaters: [...boxed.skaters, skater('user-RW', 9, 5)],
    };
    expect(isBoxedIn(withReceiver, 'user-C')).toBe(false);
  });
});
