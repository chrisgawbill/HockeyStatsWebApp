import { describe, expect, it } from 'vitest';
import {
  isPlayable,
  isStunned,
  laneBetween,
  legalSteps,
  skaterAt,
} from '@/features/board-game/engine/rink';
import { BOARD_COLS, BOARD_ROWS } from '@/features/board-game/data/balance';
import {
  MIN_PLAYABLE_TILE_COVERAGE,
  RINK_CORNER_RADIUS,
  UNPLAYABLE_CORNERS,
} from '@/features/board-game/data/rink';
import type { GameState, Skater } from '@/features/board-game/types/game';

function makeSkater(overrides: Partial<Skater> = {}): Skater {
  return {
    id: 'user-C',
    team: 'user',
    role: 'C',
    pos: { col: 5, row: 3 },
    stunnedUntilTurn: null,
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'move',
    length: 'long',
    activeTeam: 'user',
    turn: 1,
    mp: 3,
    dice: null,
    skaters: [],
    puck: { kind: 'loose', pos: { col: 7, row: 3 } },
    deck: { drawPile: [], hand: [], discardPile: [], exhaustPile: [] },
    cpuDeck: { drawPile: [], hand: [], discardPile: [], exhaustPile: [] },
    duel: null,
    lastOutcome: null,
    lastReveal: null,
    lastShotSaveResult: null,
    lastFaceoffResult: null,
    winner: null,
    rngSeed: 1,
    actionsThisTurn: 0,
    whistle: false,
    goaliePoise: { user: 43, cpu: 43 },
    faceoffSpot: { col: 7, row: 3 },
    pendingBonusMp: 0,
    ...overrides,
  };
}

describe('isPlayable', () => {
  it('rejects the unplayable corners', () => {
    expect(isPlayable({ col: 0, row: 0 })).toBe(false);
    expect(isPlayable({ col: 14, row: 6 })).toBe(false);
  });

  it('rejects the clipped tiles beside the corners', () => {
    expect(isPlayable({ col: 1, row: 0 })).toBe(false);
    expect(isPlayable({ col: 13, row: 6 })).toBe(false);
    expect(isPlayable({ col: 0, row: 1 })).toBe(false);
    expect(isPlayable({ col: 0, row: 5 })).toBe(false);
    expect(isPlayable({ col: 14, row: 1 })).toBe(false);
    expect(isPlayable({ col: 14, row: 5 })).toBe(false);
  });

  it('marks exactly the tiles too clipped by the rounded boards', () => {
    const { x: rx, y: ry } = RINK_CORNER_RADIUS;
    const inside = (x: number, y: number) => {
      const cx = x < rx ? rx : x > BOARD_COLS - rx ? BOARD_COLS - rx : null;
      const cy = y < ry ? ry : y > BOARD_ROWS - ry ? BOARD_ROWS - ry : null;
      if (cx === null || cy === null) return true;
      return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
    };
    const samples = 20;
    const expected: string[] = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        let hits = 0;
        for (let i = 0; i < samples; i++) {
          for (let j = 0; j < samples; j++) {
            if (inside(col + (i + 0.5) / samples, row + (j + 0.5) / samples))
              hits++;
          }
        }
        if (hits / samples ** 2 < MIN_PLAYABLE_TILE_COVERAGE)
          expected.push(`${col},${row}`);
      }
    }
    const actual = UNPLAYABLE_CORNERS.map((c) => `${c.col},${c.row}`);
    expect(actual.sort()).toEqual(expected.sort());
  });

  it('keeps the tiles beside the creases playable', () => {
    expect(isPlayable({ col: 0, row: 2 })).toBe(true);
    expect(isPlayable({ col: 14, row: 4 })).toBe(true);
  });

  it('rejects goalie tiles', () => {
    expect(isPlayable({ col: 0, row: 3 })).toBe(false);
    expect(isPlayable({ col: 14, row: 3 })).toBe(false);
  });

  it('accepts an ordinary tile', () => {
    expect(isPlayable({ col: 7, row: 3 })).toBe(true);
  });
});

describe('laneBetween', () => {
  it('returns tiles strictly between two coords in the same row', () => {
    expect(laneBetween({ col: 2, row: 3 }, { col: 5, row: 3 })).toEqual([
      { col: 3, row: 3 },
      { col: 4, row: 3 },
    ]);
  });

  it('returns tiles strictly between two coords in the same column', () => {
    expect(laneBetween({ col: 4, row: 1 }, { col: 4, row: 4 })).toEqual([
      { col: 4, row: 2 },
      { col: 4, row: 3 },
    ]);
  });

  it('is empty for adjacent tiles and null for a non-straight or equal pair', () => {
    expect(laneBetween({ col: 2, row: 3 }, { col: 3, row: 3 })).toEqual([]);
    expect(laneBetween({ col: 2, row: 3 }, { col: 5, row: 4 })).toBeNull();
    expect(laneBetween({ col: 2, row: 3 }, { col: 2, row: 3 })).toBeNull();
  });
});

describe('legalSteps', () => {
  it('blocks tiles occupied by another skater', () => {
    const carrier = makeSkater({ id: 'user-C', pos: { col: 5, row: 3 } });
    const blocker = makeSkater({ id: 'user-LW', pos: { col: 6, row: 3 } });
    const state = makeState({ skaters: [carrier, blocker] });
    const steps = legalSteps(state, 'user-C');
    expect(steps).not.toContainEqual({ col: 6, row: 3 });
    expect(steps).toContainEqual({ col: 4, row: 3 });
  });

  it('lets a stun expire once turn passes stunnedUntilTurn', () => {
    const stunned = makeSkater({
      id: 'user-LD',
      stunnedUntilTurn: 2,
      pos: { col: 3, row: 2 },
    });
    expect(isStunned(stunned, 2)).toBe(true);
    expect(isStunned(stunned, 3)).toBe(false);
    expect(
      legalSteps(makeState({ skaters: [stunned], turn: 2 }), 'user-LD'),
    ).toEqual([]);
    expect(
      legalSteps(makeState({ skaters: [stunned], turn: 3 }), 'user-LD').length,
    ).toBeGreaterThan(0);
  });

  it('is empty when the skater has zero MP', () => {
    const carrier = makeSkater();
    const state = makeState({ skaters: [carrier], mp: 0 });
    expect(legalSteps(state, 'user-C')).toEqual([]);
  });

  it('is empty for the goalie, a stunned skater, or the wrong phase/team', () => {
    const goalie = makeSkater({
      id: 'user-G',
      role: 'G',
      pos: { col: 0, row: 3 },
    });
    const stunned = makeSkater({
      id: 'user-LD',
      stunnedUntilTurn: 5,
      pos: { col: 3, row: 2 },
    });
    const state = makeState({ skaters: [goalie, stunned] });
    expect(legalSteps(state, 'user-G')).toEqual([]);
    expect(legalSteps(state, 'user-LD')).toEqual([]);
    expect(
      legalSteps(makeState({ skaters: [stunned], phase: 'roll' }), 'user-LD'),
    ).toEqual([]);
    expect(
      legalSteps(
        makeState({ skaters: [makeSkater()], activeTeam: 'cpu' }),
        'user-C',
      ),
    ).toEqual([]);
  });
});

describe('skaterAt', () => {
  it('finds the skater occupying a tile', () => {
    const skater = makeSkater();
    const state = makeState({ skaters: [skater] });
    expect(skaterAt(state, { col: 5, row: 3 })?.id).toBe('user-C');
    expect(skaterAt(state, { col: 0, row: 0 })).toBeUndefined();
  });
});
