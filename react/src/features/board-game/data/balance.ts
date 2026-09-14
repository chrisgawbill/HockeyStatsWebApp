/** Tunable numbers for Rink Quest. Chris owns these values. */

import type { GameLength } from '@/features/board-game/types/game';

/** Board width, in columns (`col` 0-14). */
export const BOARD_COLS = 15;
/** Board height, in rows (`row` 0-6). */
export const BOARD_ROWS = 7;

/** Starting and max poise for a non-goalie skater in a duel. */
export const SKATER_POISE = 20;

/**
 * Goalie starting/max poise by game length. Kept well under 50 - past that
 * the goalie becomes a wall and games may never end (see
 * docs/board-game-design.md §3).
 */
export const GOALIE_POISE_BY_LENGTH: Record<GameLength, number> = {
  short: 43,
  long: 44,
};

/** Energy (card-play budget) each side gets at the start of a duel round. */
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
 * LW/RW shot accuracy bonus, on the same 0-100 scale as a card's own
 * `accuracy`. Applied in the shot ante - see `shotAccuracyBonus` in
 * `engine/shotModel.ts`. Reasoning behind the 15: see
 * docs/board-game-design.md §8.
 */
export const PERK_WING_SHOT_ACCURACY = 15;
/** LD/RD bonus amount on `check`/`block`-tagged card effects (damage or block). */
export const PERK_DEFENSE_BONUS = 2;
/**
 * Extra card in the faceoff ante: both duelists in a faceoff are always the
 * C, so the ante is `3 + PERK_CENTER_FACEOFF_DRAW` cards, pick 1 (see
 * `FACEOFF_ANTE_SIZE` in `engine/faceoffDuel.ts`).
 */
export const PERK_CENTER_FACEOFF_DRAW = 1;

/**
 * Save chance by shot band (percent), before the goalie-poise and
 * shot-power modifiers `rollShotSave` applies. Chris tunes these; the
 * `perfect` ruling is deliberate, not an accident - see
 * docs/board-game-design.md §8.
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
 * Chance (percent) that a `good`/`perfect` save is covered - the goalie
 * smothers it for a whistle and a faceoff - instead of rebounding. Never
 * rolled on a `weak`/`miss` save. 25 means roughly a quarter of good/perfect
 * saves stop play rather than kicking out a loose puck, enough to matter
 * without making rebounds the exception.
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

/**
 * Clean-band window at 0 anticipation, in ms, measured from the drop.
 * Anchored on human reaction-time research so a clean win is a real ask,
 * not a given - full derivation (why 190ms and not, say, 80ms) lives in
 * docs/board-game-design.md §8.
 */
export const FACEOFF_CLEAN_WINDOW_BASE_MS = 190;
/**
 * Extra clean-band ms per anticipation point (anticipation is 0-100); keep
 * this the only anticipation-driven geometry knob, mirroring
 * `SHOT_YELLOW_WIDTH_PER_ACCURACY`. At 1ms/point, the carded anticipation
 * spread (25-85) walks the clean window from 215ms up to 275ms - the low
 * end still expects a trained-player-grade press, the high end comfortably
 * clears the ~200ms trained-player mark, so the highest-anticipation cards
 * make a clean win genuinely achievable on a sharp press rather than
 * theoretical.
 */
export const FACEOFF_WINDOW_PER_ANTICIPATION_MS = 1.0;
/**
 * Scrum-band window, in ms, measured from the drop; constant regardless of
 * anticipation so a slow draw is never a write-off - exactly the role
 * `SHOT_BLUE_BAND_WIDTH` plays for the good/blue band. 420ms clears median
 * simple reaction time (~250ms) with real headroom, so a merely-median press
 * still ties up the puck in a scrum instead of losing it outright late, and
 * low-anticipation/high-grip cards can lean on grip to win the scrum rather
 * than needing a reaction no human reliably has.
 */
export const FACEOFF_SCRUM_WINDOW_MS = 420;
/** Minimum linesman hold before the drop, in ms. */
export const FACEOFF_DROP_DELAY_MIN_MS = 700;
/** Maximum linesman hold before the drop, in ms. */
export const FACEOFF_DROP_DELAY_MAX_MS = 1800;
/**
 * Per-band base value (not a standalone win chance) used by the symmetric
 * head-to-head faceoff contest `rollFaceoffHeadToHead`. `jump` has no entry:
 * a jump never enters the contest - the jumping side either earns a re-drop
 * or forfeits outright (see `engine/faceoffDuel.ts`'s `resolveFaceoffBand`).
 * The contest takes the *difference* between the two sides' band values as
 * an edge on top of grip, so only the gaps between `clean`/`scrum`/`late`
 * matter, not their absolute size; when both sides read the same band the
 * gap is zero and grip alone decides (around a fair 50/50) unless the tied
 * band is a non-`clean` one, which is an automatic scrum instead (see
 * `rollFaceoffHeadToHead`).
 */
export const BASE_WIN_BY_BAND: Record<'clean' | 'scrum' | 'late', number> = {
  clean: 65,
  scrum: 48,
  late: 25,
};
/**
 * Sampling ceiling (ms) for a simulated faceoff reaction time - shared by
 * the CPU centre's own reaction and a human centre's reduced-motion/
 * headless fallback. Driven entirely by the anted card's `anticipation`
 * stat, so there's no separate "difficulty" constant, only where the
 * reaction-time roll tops out. 500ms anchors on the same human-reaction-time
 * research `FACEOFF_CLEAN_WINDOW_BASE_MS` cites (median ~250ms): twice the
 * median, so a genuinely slow read is still reachable without being baked
 * in as a coin flip. Not one of the tuned window constants above - moving
 * it doesn't retune `clean`/`scrum`, only where the simulated-reaction
 * ceiling sits.
 */
export const FACEOFF_REACTION_SAMPLE_CEILING_MS = 500;
/**
 * Clean-band ms shaved off the re-drop window after a jump (a false start
 * costs precision, not just a retry). Floored at 0 by
 * `narrowedWindowsAfterJump`. Models a fixed jolt to reaction precision
 * (adrenaline/self-correction after a false start), not a fraction of the
 * window, so it doesn't need to scale with the window widths. It stays a
 * meaningful bite on every carded card - a 10-14% cut to the clean window
 * across the 25-85 carded anticipation range - without being able to zero
 * out the tightest one.
 */
export const FACEOFF_JUMP_WINDOW_PENALTY_MS = 30;

/** Hard cap on actions in a single CPU turn, so the CPU heuristic can never loop forever. */
export const CPU_TURN_ACTION_CAP = 20;

/** Delay between CPU actions in useBoardGame, in ms (0 under prefers-reduced-motion). */
export const CPU_STEP_MS = 450;
