import { CARDS } from '@/features/board-game/data/cards';
import { cardBlockReason } from '@/features/board-game/engine/duel';
import { gameReducer } from '@/features/board-game/engine/gameReducer';
import { resolveShotBand } from '@/features/board-game/engine/shotDuel';
import type { GameState, ShotBand } from '@/features/board-game/types/game';
import { shotState } from '@/test/fixtures/boardScenarios';
import { describe, expect, it } from 'vitest';

function resolveShot(seed: number, band: ShotBand): GameState {
  let state = gameReducer(shotState(seed), { type: 'SHOOT' });
  state = gameReducer(state, { type: 'PICK_SHOT_CARD', handIndex: 0 });
  const cardId = state.duel!.shotPickedCardId!;
  return resolveShotBand(state, cardId, band);
}

describe('deterministic browser QA state harness', () => {
  it('reaches both shot results from a fixed seed search, and NEW_GAME resets them', () => {
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

    // Returns the deterministic game-over fixture to the opening state.
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
});
