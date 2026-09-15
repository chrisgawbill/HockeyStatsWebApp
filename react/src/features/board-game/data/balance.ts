/** Tunable numbers for Rink Quest. Chris owns these values. */

import type { GameLength } from '@/features/board-game/types/game';

/** Board width, in columns (`col` 0-14). */
export const BOARD_COLS = 15;
/** Board height, in rows (`row` 0-6). */
export const BOARD_ROWS = 7;

/** Starting/max poise for a non-goalie skater; 0 poise is a KO. */
export const SKATER_POISE = 20;

/** Starting goalie poise by game length; it persists across the match and affects later saves. */
export const GOALIE_POISE_BY_LENGTH: Record<GameLength, number> = {
  short: 43,
  long: 44,
};

/** Energy budget per duel round. */
export const ENERGY = 3;
/** Cards dealt at the start of a duel round. */
export const HAND_SIZE = 5;
/** Duel rounds before the defender wins on timeout. */
export const MAX_ROUNDS = 3;

/** MP cost per board action. */
export const COST = {
  move: 1,
  pass: 2,
  shoot: 3,
  check: 1,
};

/** LW/RW shot accuracy bonus, on the same 0-100 scale as card accuracy. */
export const PERK_WING_SHOT_ACCURACY = 15;
/** LD/RD bonus to damage or block on check/block-tagged cards. */
export const PERK_DEFENSE_BONUS = 2;
/** Extra card in each centre's faceoff ante. */
export const PERK_CENTER_FACEOFF_DRAW = 1;

/** Base save chance by shot band, before poise/power modifiers. */
export const BASE_SAVE_BY_BAND: Record<
  'perfect' | 'good' | 'weak' | 'miss',
  number
> = {
  perfect: 20,
  good: 48,
  weak: 73,
  miss: 96,
};
/** Chance that a good/perfect save is covered rather than rebounding. */
export const SHOT_COVER_CHANCE = 25;
/** Save chance floor after modifiers. */
export const MIN_SAVE_CHANCE = 5;
/** Save chance ceiling after modifiers. */
export const MAX_SAVE_CHANCE = 97;
/** Maximum save-chance penalty from depleted goalie poise. */
export const POISE_SAVE_PENALTY_MAX = 15;
/** Perfect (yellow) band width at 0 accuracy. */
export const SHOT_YELLOW_BASE_WIDTH = 0.03;
/** Extra perfect-band width per accuracy point. */
export const SHOT_YELLOW_WIDTH_PER_ACCURACY = 0.0015;
/** Good (light blue) band's full width; constant across accuracy. */
export const SHOT_BLUE_BAND_WIDTH = 0.32;
/** CPU shot accuracy for its seeded band roll. */
export const CPU_SHOT_ACCURACY = 55;

/** Clean reaction window at 0 anticipation, anchored on human reaction-time research. */
export const FACEOFF_CLEAN_WINDOW_BASE_MS = 190;
/** Extra clean-window milliseconds per anticipation point. */
export const FACEOFF_WINDOW_PER_ANTICIPATION_MS = 1.0;
/** Scrum reaction window; constant regardless of anticipation. */
export const FACEOFF_SCRUM_WINDOW_MS = 420;
/** Minimum linesman hold before the drop. */
export const FACEOFF_DROP_DELAY_MIN_MS = 700;
/** Maximum linesman hold before the drop. */
export const FACEOFF_DROP_DELAY_MAX_MS = 1800;
/** Base band values used to calculate symmetric faceoff win odds. */
export const BASE_WIN_BY_BAND: Record<'clean' | 'scrum' | 'late', number> = {
  clean: 65,
  scrum: 48,
  late: 25,
};
/** Sampling ceiling for simulated CPU/reduced-motion faceoff reactions. */
export const FACEOFF_REACTION_SAMPLE_CEILING_MS = 500;
/** Clean-window penalty after a false start. */
export const FACEOFF_JUMP_WINDOW_PENALTY_MS = 30;

/** Hard cap on actions in a CPU turn. */
export const CPU_TURN_ACTION_CAP = 20;
/** Delay between CPU actions in milliseconds. */
export const CPU_STEP_MS = 450;
