/** Tunable numbers for Rink Quest. Chris owns these values. */

import type { GameLength } from '@/features/board-game/types/game';

export const BOARD_COLS = 15;
export const BOARD_ROWS = 7;

export const SKATER_POISE = 20;

/** From the PM's sim sweep (BG-A10); 50+ turns the goalie into a wall and games may never end. */
export const GOALIE_POISE_BY_LENGTH: Record<GameLength, number> = {
  short: 43,
  long: 44,
};

export const ENERGY = 3;
export const HAND_SIZE = 5;
export const MAX_ROUNDS = 3;

export const COST = {
  move: 1,
  pass: 2,
  shoot: 3,
  check: 1,
};

/** LW/RW bonus damage on `shot`-tagged cards. */
export const PERK_WING_SHOT_BONUS = 2;
/** LD/RD bonus amount on `check`/`block`-tagged card effects (damage or block). */
export const PERK_DEFENSE_BONUS = 2;
/** Extra cards the C draws when it is the faceoff duelist. */
export const PERK_CENTER_FACEOFF_DRAW = 1;

export const CPU_TURN_ACTION_CAP = 20;

/** Delay between CPU actions in useBoardGame, in ms (0 under prefers-reduced-motion). */
export const CPU_STEP_MS = 450;
