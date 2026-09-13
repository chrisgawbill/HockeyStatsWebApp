import { CPU_TURN_ACTION_CAP } from '@/features/board-game/data/balance';
import { chooseActionFor } from '@/features/board-game/ai/cpuBoardAgent';
import { planCards } from '@/features/board-game/engine/cpuDuelPolicy';
import {
  createInitialState,
  gameReducer,
} from '@/features/board-game/engine/gameReducer';
import type {
  DuelOutcome,
  GameLength,
  GameState,
} from '@/features/board-game/types/game';

export interface AutoplayResult {
  finalState: GameState;
  /** The state.turn value at the end of the game (or when the turn cap was hit). */
  turns: number;
  /** The largest actionsThisTurn seen over the whole game, for cap-safety assertions. */
  maxActionsInATurn: number;
  /** How many times the §3 whistle (boxed-in carrier) reset the board this game. */
  whistles: number;
  /** Every duel outcome resolved this game, in order, for balance breakdowns. */
  duelOutcomes: DuelOutcome[];
}

/** One step of a duel: plan the user's round with `planCards`, queue each card, then reveal. */
function stepDuel(state: GameState): GameState {
  const plan = planCards(state, 'user');
  let next = state;
  for (const cardId of plan) {
    const handIndex = next.deck.hand.indexOf(cardId);
    if (handIndex === -1) continue;
    next = gameReducer(next, { type: 'PLAY_CARD', handIndex });
  }
  return gameReducer(next, { type: 'END_DUEL_ROUND' });
}

/** One step of a headless game: both sides driven by the same board-AI policy, mirrored by team. */
function step(state: GameState): GameState {
  switch (state.phase) {
    case 'faceoff':
      return gameReducer(state, { type: 'START_FACEOFF' });
    case 'duel':
      return stepDuel(state);
    case 'duelResult':
      return gameReducer(state, { type: 'DISMISS_DUEL_RESULT' });
    case 'roll':
    case 'move':
      return gameReducer(state, chooseActionFor(state, state.activeTeam));
    default:
      return state;
  }
}

/**
 * Plays a full seeded game headlessly, both sides driven by `chooseActionFor`.
 * Used for the BG-A5 balance sim and its tests. Stops early past `maxTurns`
 * or a generous overall step budget, in case a bug causes a true stall.
 */
export function playHeadlessGame(
  seed: number,
  length: GameLength,
  maxTurns = 400,
): AutoplayResult {
  let state = createInitialState(seed, length);
  let maxActionsInATurn = 0;
  let whistles = 0;
  const duelOutcomes: DuelOutcome[] = [];
  const maxSteps = maxTurns * (CPU_TURN_ACTION_CAP + 10);

  for (
    let i = 0;
    i < maxSteps && state.phase !== 'gameOver' && state.turn <= maxTurns;
    i++
  ) {
    const wasWhistle = state.whistle;
    const previousOutcome = state.lastOutcome;
    state = step(state);
    if (state.whistle && !wasWhistle) whistles++;
    if (state.lastOutcome && state.lastOutcome !== previousOutcome) {
      duelOutcomes.push(state.lastOutcome);
    }
    if (state.actionsThisTurn > maxActionsInATurn)
      maxActionsInATurn = state.actionsThisTurn;
  }

  return {
    finalState: state,
    turns: state.turn,
    maxActionsInATurn,
    whistles,
    duelOutcomes,
  };
}
