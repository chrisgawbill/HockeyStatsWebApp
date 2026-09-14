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
/**
 * Extra card in the faceoff ante (BG-A15b): both duelists in a faceoff are
 * always the C, so the ante is `3 + PERK_CENTER_FACEOFF_DRAW` cards, pick 1
 * (see `FACEOFF_ANTE_SIZE` in `engine/faceoffDuel.ts`) - draw 4, not the
 * plain 3-card offer a shot ante gets. Single-source: before BG-A15b this
 * same constant instead widened the old faceoff card duel's dealt hand by
 * one; the perk's *value* hasn't changed, only what kind of draw it grows.
 */
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

/**
 * Faceoff minigame model (BG-A15a, additive - not yet called by the running
 * game; see `engine/faceoffModel.ts`). The faceoff stays a card duel until
 * BG-A15b repoints it. Chris tunes these; placeholders below reason from the
 * 700-1800ms drop hold and Chris's standing BG-A14a ruling that difficulty
 * comes from window width, never hold speed. The window widths (BG-A15a
 * cycle 1 retune, PM/QA finding) are anchored on human simple-visual-
 * reaction-time research: median reaction ~250ms, trained player ~200ms,
 * ~150ms exceptional/guess-territory - see `FACEOFF_CLEAN_WINDOW_BASE_MS`.
 */
/**
 * Clean-band window at 0 anticipation, in ms, measured from the drop.
 * Anchored on human simple-visual-reaction-time research (BG-A15a QA/PM
 * finding): median untrained reaction is ~250ms, a trained player reaches
 * ~200ms, ~150ms is exceptional and often a guess. 190ms sits just under
 * "trained player" so a clean win at 0 anticipation is a real ask - a sharp
 * press from a fast reader, not a given for anyone.
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
 * Per-band base value used by the symmetric head-to-head faceoff contest
 * (BG-A15b cycle 2's `rollFaceoffHeadToHead`), by band. `jump` has no
 * entry: a jump never enters the contest at all - the jumping side either
 * earns a re-drop or forfeits outright (see `engine/faceoffDuel.ts`'s
 * `resolveFaceoffBand`). These aren't standalone win chances any more
 * (cycle 1's one-sided model rolled a band straight against this as a flat
 * percent); the contest now takes the *difference* between the two sides'
 * band values as an edge on top of grip, so only the gaps between
 * `clean`/`scrum`/`late` matter, not their absolute size. When both sides
 * read the same band the gap is zero and grip alone (around a fair 50/50)
 * decides - true whether that tied band is `clean` (a real roll) or not
 * (`scrum`/`scrum` and `late`/`late` are automatic scrums instead, since
 * there's nothing left to grade a tied non-`clean` read on; see
 * `rollFaceoffHeadToHead`). `scrum` and `late` need real entries here
 * because a `scrum` read genuinely outcompetes a `late` one when the two
 * differ - their values set both that edge and how much of an edge `clean`
 * gets over each of them.
 */
export const BASE_WIN_BY_BAND: Record<'clean' | 'scrum' | 'late', number> = {
  clean: 65,
  scrum: 48,
  late: 25,
};
/**
 * Sampling ceiling (ms) for a simulated faceoff reaction time - shared by
 * the CPU centre's own reaction and a human centre's reduced-motion/
 * headless fallback (BG-A15b cycle 2's `rollBandFromAnticipation`; Chris's
 * ruling that the two must be genuinely comparable, not the CPU alone).
 * Unlike `CPU_SHOT_ACCURACY` (a flat aim difficulty the shot model
 * intentionally keeps independent of the CPU's card), this reaction is
 * driven entirely by whichever card was anted (its `anticipation` stat), so
 * there's no separate "difficulty" constant - only where the reaction-time
 * roll tops out. BG-A15a's first cut reused `FACEOFF_SCRUM_WINDOW_MS * 2`
 * for this, which pinned `late` at exactly 50% of every roll regardless of
 * anticipation (the domain's midpoint always landed on the scrum window's
 * outer edge) - a QA finding, not a balance call, and one that turned out to
 * hit the reduced-motion fallback exactly as hard as the CPU once measured.
 * 500ms instead anchors on the same human-reaction-time research
 * `FACEOFF_CLEAN_WINDOW_BASE_MS` cites (median ~250ms): twice the median,
 * so a genuinely slow read is still reachable without being baked in as a
 * coin flip. Not one of the three tuned window constants above - moving it
 * doesn't retune `clean/scrum`, only where the simulated-reaction ceiling
 * sits.
 */
export const FACEOFF_REACTION_SAMPLE_CEILING_MS = 500;
/**
 * Clean-band ms shaved off the re-drop window after a jump (a false start
 * costs precision, not just a retry). Floored at 0 by
 * `narrowedWindowsAfterJump`. Re-checked against the BG-A15a cycle-1 window
 * retune and left at 30: unlike the window widths, this models a fixed
 * jolt to reaction precision (adrenaline/self-correction after a false
 * start), not a fraction of the window, so it doesn't need to scale with
 * the wider windows. It stays a meaningful bite on every carded card - a
 * 10-14% cut to the clean window across the 25-85 carded anticipation
 * range - without being able to zero out the tightest one.
 */
export const FACEOFF_JUMP_WINDOW_PENALTY_MS = 30;

export const CPU_TURN_ACTION_CAP = 20;

/** Delay between CPU actions in useBoardGame, in ms (0 under prefers-reduced-motion). */
export const CPU_STEP_MS = 450;
