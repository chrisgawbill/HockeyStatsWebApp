import { describe, expect, it } from 'vitest';
import type { Action, GameState } from '@/features/board-game/types/game';
import { chooseActionFor } from '@/features/board-game/ai/cpuBoardAgent';
import { gameReducer } from '@/features/board-game/engine/gameReducer';
import { legalSteps } from '@/features/board-game/engine/rink';
import { pickBestFaceoffCard } from '@/features/board-game/engine/faceoffDuel';
import { pickBestShotCard } from '@/features/board-game/engine/shotDuel';
import {
  arenaCameraShotFor,
  cameraPoseFor,
  tacticalPose,
  tileScreenRect,
  type ArenaView,
} from '@/features/board-game/utils/arenaCamera';
import { shotState } from '@/test/fixtures/boardScenarios';

const SEED = 7;
const MAX_ACTIONS = 600;

/** Freezes a state tree so any write by presentation code throws. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** A fixed, rules-only policy for both sides, mirroring the headless sim. */
function nextAction(state: GameState): Action {
  switch (state.phase) {
    case 'faceoff':
      return { type: 'START_FACEOFF' };
    case 'duelResult':
      return { type: 'DISMISS_DUEL_RESULT' };
    case 'move':
      return chooseActionFor(state, state.activeTeam);
    default:
      break;
  }
  const duel = state.duel!;
  if (duel.kind === 'shot') {
    return duel.shotPickedCardId === null
      ? {
          type: 'PICK_SHOT_CARD',
          handIndex: state.deck.hand.indexOf(pickBestShotCard(state.deck.hand)),
        }
      : { type: 'RESOLVE_SHOT_BAND', band: 'good' };
  }
  if (duel.kind === 'faceoff') {
    return duel.faceoffPickedCardId === null && state.deck.hand.length > 0
      ? {
          type: 'PICK_FACEOFF_CARD',
          handIndex: state.deck.hand.indexOf(
            pickBestFaceoffCard(state.deck.hand),
          ),
        }
      : { type: 'AUTO_RESOLVE_FACEOFF' };
  }
  return { type: 'END_DUEL_ROUND' };
}

/** Everything the arena derives from a state, in both orientations. */
function drawArena(state: GameState): ArenaView {
  const viewport = { width: 390, height: 600 };
  const cameraShot = arenaCameraShotFor(state);
  for (const orientation of ['wide', 'tall'] as const) {
    cameraPoseFor(cameraShot, state.skaters, orientation, viewport);
    const overlayPose = tacticalPose(orientation, viewport);
    for (const skater of state.skaters) {
      tileScreenRect(skater.pos, overlayPose, viewport);
      for (const coord of legalSteps(state, skater.id)) {
        tileScreenRect(coord, overlayPose, viewport);
      }
    }
  }
  return cameraShot.view;
}

describe('arena presentation determinism', () => {
  it('gives identical states for the same seed and actions with or without the arena drawn', () => {
    const actions: Action[] = [];
    const statesWithArena: GameState[] = [];
    const viewsSeen = new Set<ArenaView>();
    // Opens with Blue's centre in shooting range, so the shot view is drawn too.
    let state = shotState(SEED);

    while (state.phase !== 'gameOver' && actions.length < MAX_ACTIONS) {
      viewsSeen.add(drawArena(deepFreeze(state)));
      const action = nextAction(state);
      actions.push(action);
      state = gameReducer(state, action);
      statesWithArena.push(state);
    }

    let replayed = shotState(SEED);
    actions.forEach((action, index) => {
      replayed = gameReducer(replayed, action);
      expect(replayed).toEqual(statesWithArena[index]);
    });

    expect(viewsSeen).toEqual(new Set(['tactical', 'shot']));
  });
});
