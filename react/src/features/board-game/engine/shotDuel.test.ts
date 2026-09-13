import { describe, expect, it } from 'vitest';
import { GOALIE_POISE_BY_LENGTH } from '@/features/board-game/data/balance';
import { CARDS } from '@/features/board-game/data/cards';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import {
  canPickShotCard,
  pickBestShotCard,
  pickShotCard,
  resolveShotBand,
  shotBandWidthsFor,
} from '@/features/board-game/engine/shotDuel';
import type { GameState } from '@/features/board-game/types/game';

/** Fresh 'move' state with the user carrying the puck in the offensive zone, ready to SHOOT. */
function makeShootState(seed = 1): GameState {
  const state = createInitialState(seed, 'long');
  const skaters = state.skaters.map((s) =>
    s.id === 'user-C' ? { ...s, pos: { col: 11, row: 3 } } : s,
  );
  return {
    ...state,
    phase: 'move',
    mp: 3,
    skaters,
    puck: { kind: 'carried', skaterId: 'user-C' },
  };
}

describe('createShotDuel (user shooter)', () => {
  it('draws a 3-card shot-pool ante into the user hand and waits in the duel phase', () => {
    const next = gameReducer(makeShootState(), { type: 'SHOOT' });
    expect(next.phase).toBe('duel');
    expect(next.duel!.kind).toBe('shot');
    expect(next.duel!.shotPickedCardId).toBeNull();
    expect(next.deck.hand).toHaveLength(3);
    expect(next.deck.hand.every((id) => CARDS[id].tags.includes('shot'))).toBe(
      true,
    );
  });

  it('is deterministic for a fixed seed', () => {
    const a = gameReducer(makeShootState(7), { type: 'SHOOT' });
    const b = gameReducer(makeShootState(7), { type: 'SHOOT' });
    expect(a.deck.hand).toEqual(b.deck.hand);
  });
});

describe('canPickShotCard / pickShotCard', () => {
  it('rejects an index once a pick has already been made', () => {
    let state = gameReducer(makeShootState(), { type: 'SHOOT' });
    state = gameReducer(state, { type: 'PICK_SHOT_CARD', handIndex: 0 });
    expect(state.duel!.shotPickedCardId).not.toBeNull();
    expect(canPickShotCard(state, 1)).toBe(false);
    expect(pickShotCard(state, 1)).toBe(state);
  });

  it('shotBandWidthsFor is null before a pick and non-null after', () => {
    let state = gameReducer(makeShootState(), { type: 'SHOOT' });
    expect(shotBandWidthsFor(state)).toBeNull();
    state = gameReducer(state, { type: 'PICK_SHOT_CARD', handIndex: 0 });
    const widths = shotBandWidthsFor(state);
    expect(widths).not.toBeNull();
    expect(widths!.yellowWidth).toBeGreaterThan(0);
    expect(widths!.blueWidth).toBeGreaterThan(0);
  });
});

describe('resolveShotBand', () => {
  function pickedState(seed = 1): GameState {
    let state = gameReducer(makeShootState(seed), { type: 'SHOOT' });
    state = gameReducer(state, { type: 'PICK_SHOT_CARD', handIndex: 0 });
    return state;
  }

  it('a beat (band not saved) scores a goal and ends the game', () => {
    // slapshot power 9 vs a fresh goalie should beat a perfect band often; try seeds until we find one.
    let found = false;
    for (let seed = 1; seed <= 50 && !found; seed++) {
      const state = pickedState(seed);
      const cardId = state.duel!.shotPickedCardId!;
      const next = resolveShotBand(state, cardId, 'perfect');
      if (next.phase === 'gameOver') {
        expect(next.winner).toBe('user');
        expect(next.lastOutcome!.goal).toBe(true);
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('a weak-band save freezes the puck and drains no more than the picked card power', () => {
    let found = false;
    for (let seed = 1; seed <= 50 && !found; seed++) {
      const state = pickedState(seed);
      const cardId = state.duel!.shotPickedCardId!;
      const power = CARDS[cardId].power!;
      const before = state.goaliePoise.cpu;
      const next = resolveShotBand(state, cardId, 'weak');
      if (next.phase === 'duelResult' && !next.lastOutcome!.goal) {
        expect(next.lastOutcome!.cleanSave).toBe(true);
        expect(before - next.goaliePoise.cpu).toBeLessThanOrEqual(power);
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('a good-band save rebounds (not a clean save) when it saves', () => {
    let found = false;
    for (let seed = 1; seed <= 50 && !found; seed++) {
      const state = pickedState(seed);
      const cardId = state.duel!.shotPickedCardId!;
      const next = resolveShotBand(state, cardId, 'good');
      if (next.phase === 'duelResult' && !next.lastOutcome!.goal) {
        expect(next.lastOutcome!.cleanSave).toBe(false);
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('poise persists across shots: a drained goalie saves less than a fresh one over many trials', () => {
    let freshSaves = 0;
    let drainedSaves = 0;
    const trials = 300;
    for (let seed = 1; seed <= trials; seed++) {
      let fresh = pickedState(seed);
      const cardId = fresh.duel!.shotPickedCardId!;
      const freshResult = resolveShotBand(fresh, cardId, 'weak');
      if (!freshResult.lastOutcome!.goal) freshSaves++;

      let drained = pickedState(seed + 10000);
      drained = {
        ...drained,
        goaliePoise: { ...drained.goaliePoise, cpu: 1 },
      };
      const drainedCardId = drained.duel!.shotPickedCardId!;
      const drainedResult = resolveShotBand(drained, drainedCardId, 'weak');
      if (!drainedResult.lastOutcome!.goal) drainedSaves++;
    }
    expect(drainedSaves).toBeLessThan(freshSaves);
  });
});

describe('createShotDuel (CPU shooter)', () => {
  function makeCpuShootState(seed = 1): GameState {
    const state = createInitialState(seed, 'long');
    const skaters = state.skaters.map((s) =>
      s.id === 'cpu-C' ? { ...s, pos: { col: 3, row: 3 } } : s,
    );
    return {
      ...state,
      phase: 'move',
      activeTeam: 'cpu',
      mp: 3,
      skaters,
      puck: { kind: 'carried', skaterId: 'cpu-C' },
    };
  }

  it('resolves entirely in one call - never enters the duel phase - through the same rollShotSave path', () => {
    const next = gameReducer(makeCpuShootState(), { type: 'SHOOT' });
    expect(next.phase === 'gameOver' || next.phase === 'duelResult').toBe(true);
    expect(next.duel).toBeNull();
    expect(next.lastOutcome!.kind).toBe('shot');
  });

  it('picks the highest-power card offered', () => {
    expect(pickBestShotCard(['wrist_shot', 'slapshot', 'snap_shot'])).toBe(
      'slapshot',
    );
  });
});

describe('goalie poise seeding', () => {
  it('seeds both teams from GOALIE_POISE_BY_LENGTH on NEW_GAME', () => {
    const short = createInitialState(1, 'short');
    expect(short.goaliePoise).toEqual({
      user: GOALIE_POISE_BY_LENGTH.short,
      cpu: GOALIE_POISE_BY_LENGTH.short,
    });
  });
});
