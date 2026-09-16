import { describe, expect, it } from 'vitest';
import { CARDS } from '@/features/board-game/data/cards';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import { cardBlockReason } from '@/features/board-game/engine/duel';
import { resolveShotBand } from '@/features/board-game/engine/shotDuel';
import type { GameState, ShotBand } from '@/features/board-game/types/game';

/**
 * Deterministic UI-state smoke harness for browser QA follow-ups. It keeps
 * seeded setup in one place so visual passes can target the same result,
 * disabled-card, and reset states without relying on timing or random play.
 */
function shotState(seed: number): GameState {
  const initial = createInitialState(seed, 'short');
  return {
    ...initial,
    phase: 'move',
    mp: 3,
    skaters: initial.skaters.map((skater) =>
      skater.id === 'user-C' ? { ...skater, pos: { col: 11, row: 3 } } : skater,
    ),
    puck: { kind: 'carried', skaterId: 'user-C' },
  };
}

function resolveShot(seed: number, band: ShotBand): GameState {
  let state = gameReducer(shotState(seed), { type: 'SHOOT' });
  state = gameReducer(state, { type: 'PICK_SHOT_CARD', handIndex: 0 });
  const cardId = state.duel!.shotPickedCardId!;
  return resolveShotBand(state, cardId, band);
}

describe('deterministic browser QA state harness', () => {
  it('reaches both shot result variants from a fixed seed search', () => {
    let goal: GameState | undefined;
    let save: GameState | undefined;

    for (let seed = 1; seed <= 50 && (!goal || !save); seed += 1) {
      const result = resolveShot(seed, 'perfect');
      if (result.phase === 'gameOver') goal = result;
      if (result.phase === 'duelResult') save = result;
    }

    expect(goal?.winner).toBe('user');
    expect(goal?.lastOutcome?.goal).toBe(true);
    expect(save?.lastOutcome?.goal).toBe(false);
    expect(save?.lastShotSaveResult).not.toBeNull();
  });

  it('exposes a deterministic disabled-card state with its reason', () => {
    let state = gameReducer(shotState(1), { type: 'SHOOT' });
    const cardId = state.deck.hand[0];
    state = {
      ...state,
      duel: { ...state.duel!, energy: 0 },
    };

    expect(CARDS[cardId].cost).toBeGreaterThan(0);
    expect(cardBlockReason(state, 0)).toBe('energy');
  });

  it('returns the deterministic game-over fixture to the opening state', () => {
    const gameOver = resolveShot(1, 'perfect');
    const reset = gameReducer(gameOver, {
      type: 'NEW_GAME',
      seed: 99,
      length: 'short',
    });

    expect(reset.phase).toBe('faceoff');
    expect(reset.winner).toBeNull();
    expect(reset.lastOutcome).toBeNull();
    expect(reset.deck.hand).toHaveLength(0);
  });
});
