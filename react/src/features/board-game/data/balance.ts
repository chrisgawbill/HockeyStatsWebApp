/** Tunable numbers for Rink Quest. Chris owns these values. */

import type { GameLength } from '@/features/board-game/types/game';

/** Board width, in columns (`col` 0-14). */
export const BOARD_COLS = 15;
/** Board height, in rows (`row` 0-6). */
export const BOARD_ROWS = 7;

/** Starting/max poise for a non-goalie skater in a duel — card damage drains it (after block absorbs first); 0 poise is a KO. */
export const SKATER_POISE = 20;

/**
 * Goalie starting/max poise by game length — same poise concept as
 * `SKATER_POISE`, but persists across the match and only weakens future
 * saves (`poiseFactor`) as it drains, never KOs outright. Kept well under
 * 50 (past that a wall stops games ending) — see docs/board-game-design.md §3.
 */
export const GOALIE_POISE_BY_LENGTH: Record<GameLength, number> = {
  short: 43,
  long: 44,
};

/** Energy: card-play budget per duel round, spent as `card.cost` when a card is queued/played. */
export const ENERGY = 3;
/** Cards dealt to hand at the start of a duel round (a centre's faceoff ante is separate - see `PERK_CENTER_FACEOFF_DRAW`). */
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

/**
 * LW/RW shot accuracy bonus, on the same 0-100 scale as a card's `accuracy`,
 * applied in the shot ante (`shotAccuracyBonus` in `engine/shotModel.ts`).
 * See docs/board-game-design.md §8 for why 15.
 */
export const PERK_WING_SHOT_ACCURACY = 15;
/** LD/RD adds this to a card's damage or block points (whichever effect it has) on any `check`- or `block`-tagged card. */
export const PERK_DEFENSE_BONUS = 2;
/**
 * Extra card in the faceoff ante (both duelists are always C): ante size is
 * `3 + PERK_CENTER_FACEOFF_DRAW`, pick 1 — see `FACEOFF_ANTE_SIZE` in engine/faceoffDuel.ts.
 */
export const PERK_CENTER_FACEOFF_DRAW = 1;

/**
 * Save chance by shot band (percent), before poise/power modifiers in
 * `rollShotSave`. `perfect`'s value is a deliberate ruling, not a tuning
 * accident — see docs/board-game-design.md §8.
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
 * Chance (percent) that a `good`/`perfect` save is covered — a whistle and
 * faceoff instead of a rebound; never rolled on `weak`/`miss`. 25 ≈ a
 * quarter of such saves, enough to matter without making rebounds rare.
 */
export const SHOT_COVER_CHANCE = 25;
/** Save chance floor (percent) after all modifiers. */
export const MIN_SAVE_CHANCE = 5;
/** Save chance ceiling (percent) after all modifiers. */
export const MAX_SAVE_CHANCE = 97;
/** Max save-chance penalty, in percentage points (not poise) — via `poiseFactor`, 0 at full goalie poise, scaling linearly to this full penalty at 0. */
export const POISE_SAVE_PENALTY_MAX = 15;
/** Perfect (yellow) band width at 0 accuracy, as a fraction of the `[0,1]` track. */
export const SHOT_YELLOW_BASE_WIDTH = 0.03;
/** Extra yellow-band width per accuracy point (accuracy is 0-100); keep this the only accuracy-driven geometry knob. */
export const SHOT_YELLOW_WIDTH_PER_ACCURACY = 0.0015;
/** Good (light blue) band's full width, as a fraction of the `[0,1]` track; constant across accuracy so a shot is never a write-off. */
export const SHOT_BLUE_BAND_WIDTH = 0.32;
/** CPU shot "aim" difficulty (0-100, higher is more accurate) for its seeded band roll. */
export const CPU_SHOT_ACCURACY = 55;

/**
 * Clean-band window at 0 anticipation, in ms from the drop. Anchored on
 * human reaction-time research; full derivation in docs/board-game-design.md §8.
 */
export const FACEOFF_CLEAN_WINDOW_BASE_MS = 190;
/**
 * Extra clean-band ms per anticipation point (0-100 scale); the only
 * anticipation-driven geometry knob (mirrors `SHOT_YELLOW_WIDTH_PER_ACCURACY`).
 * See docs/board-game-design.md §8 for the resulting window range.
 */
export const FACEOFF_WINDOW_PER_ANTICIPATION_MS = 1.0;
/**
 * Scrum-band window, in ms from the drop; constant regardless of
 * anticipation (mirrors `SHOT_BLUE_BAND_WIDTH`'s role for shots). See
 * docs/board-game-design.md §8 for why 420ms.
 */
export const FACEOFF_SCRUM_WINDOW_MS = 420;
/** Minimum linesman hold before the drop, in ms. */
export const FACEOFF_DROP_DELAY_MIN_MS = 700;
/** Maximum linesman hold before the drop, in ms. */
export const FACEOFF_DROP_DELAY_MAX_MS = 1800;
/**
 * Per-band base value (not a win chance itself) for `rollFaceoffHeadToHead`;
 * only the gaps between bands matter, not absolute size. No `jump` entry —
 * see `resolveFaceoffBand` in engine/faceoffDuel.ts. Full formula:
 * docs/board-game-design.md §8.
 */
export const BASE_WIN_BY_BAND: Record<'clean' | 'scrum' | 'late', number> = {
  clean: 65,
  scrum: 48,
  late: 25,
};
/**
 * Sampling ceiling (ms) for a simulated faceoff reaction — CPU centre and
 * the human reduced-motion/headless fallback. Not a tuned window constant;
 * see docs/board-game-design.md §8 for the 500ms anchor.
 */
export const FACEOFF_REACTION_SAMPLE_CEILING_MS = 500;
/**
 * Clean-band ms shaved off the re-drop window after a jump; floored at 0 by
 * `narrowedWindowsAfterJump`. A fixed ms penalty (not a fraction of the
 * window) — see docs/board-game-design.md §8 for the resulting cut range.
 */
export const FACEOFF_JUMP_WINDOW_PENALTY_MS = 30;

/** Hard cap on actions in a single CPU turn, so the CPU heuristic can never loop forever. */
export const CPU_TURN_ACTION_CAP = 20;

/** Delay between CPU actions in useBoardGame, in ms (0 under prefers-reduced-motion). */
export const CPU_STEP_MS = 450;
