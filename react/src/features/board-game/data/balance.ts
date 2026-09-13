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

/**
 * LW/RW shot accuracy bonus (BG-A14a/b), on the same 0-100 scale as card
 * accuracy. Replaces the old damage-scale wing bonus now that shots resolve
 * through the ante/band model instead of card damage - see
 * `shotAccuracyBonus` in `engine/shotModel.ts`. Chris-tunable placeholder:
 * ~15 widens the yellow band by ~0.023 of the track, noticeable without
 * eclipsing the card choice.
 */
export const PERK_WING_SHOT_ACCURACY = 15;
/** LD/RD bonus amount on `check`/`block`-tagged card effects (damage or block). */
export const PERK_DEFENSE_BONUS = 2;
/** Extra cards the C draws when it is the faceoff duelist. */
export const PERK_CENTER_FACEOFF_DRAW = 1;

/**
 * Shot minigame model (BG-A14a, additive - not yet called by the running
 * game; see `engine/shotModel.ts`). Chris tunes these; placeholders anchored
 * on the ruling that a perfect shot is still saved ~20% of the time.
 */
export const BASE_SAVE_BY_BAND: Record<
  'perfect' | 'good' | 'weak' | 'miss',
  number
> = {
  perfect: 20,
  good: 48,
  weak: 73,
  miss: 96,
};
/**
 * Chance (percent, BG-A16) that a `good`/`perfect` save is covered - the
 * goalie smothers it for a whistle and a faceoff - instead of rebounding.
 * Never rolled on a `weak`/`miss` save. Chris-tunable placeholder: 25 means
 * roughly a quarter of good/perfect saves stop play rather than kicking out
 * a loose puck, enough to matter without making rebounds the exception.
 */
export const SHOT_COVER_CHANCE = 25;
/** Save chance is clamped to this range (percent) after all modifiers. */
export const MIN_SAVE_CHANCE = 5;
export const MAX_SAVE_CHANCE = 97;
/** Save-chance points lost when the goalie's poise is fully drained; 0 at full poise, scales linearly in between. */
export const POISE_SAVE_PENALTY_MAX = 15;
/** Perfect (yellow) band width at 0 accuracy, as a fraction of the `[0,1]` track. */
export const SHOT_YELLOW_BASE_WIDTH = 0.03;
/** Extra yellow-band width per accuracy point (accuracy is 0-100); keep this the only accuracy-driven geometry knob. */
export const SHOT_YELLOW_WIDTH_PER_ACCURACY = 0.0015;
/** Good (light blue) band's full width; stays roughly constant across accuracy so a shot is never a write-off. */
export const SHOT_BLUE_BAND_WIDTH = 0.32;
/** CPU shot "aim" difficulty (0-100, higher is more accurate) for its seeded band roll. */
export const CPU_SHOT_ACCURACY = 55;

export const CPU_TURN_ACTION_CAP = 20;

/** Delay between CPU actions in useBoardGame, in ms (0 under prefers-reduced-motion). */
export const CPU_STEP_MS = 450;
