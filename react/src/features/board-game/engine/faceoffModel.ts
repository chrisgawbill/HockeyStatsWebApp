/**
 * Faceoff minigame engine model (BG-A15a; wired in by BG-A15b's
 * `engine/faceoffDuel.ts`, which fully replaced the old faceoff card duel).
 * BG-A15b cycle 2 (Chris's ruling): the draw is a genuine head-to-head -
 * both centres ante a card and produce a real reaction band, resolved by
 * the ONE symmetric `rollFaceoffHeadToHead`, never a separate path for the
 * user or the CPU. Contract for BG-B25: `FaceoffBand`, `FaceoffBandWindows`,
 * and `rollFaceoffHeadToHead` (types/game.ts has the shapes). Windows come
 * from `windowsForAnticipation`; the UI must not hardcode window geometry.
 * Mirrors `shotModel.ts`'s structure: a card's `anticipation`/`grip` play
 * the same two roles `accuracy`/`power` play there.
 */
import {
  BASE_WIN_BY_BAND,
  FACEOFF_CLEAN_WINDOW_BASE_MS,
  FACEOFF_DROP_DELAY_MAX_MS,
  FACEOFF_DROP_DELAY_MIN_MS,
  FACEOFF_JUMP_WINDOW_PENALTY_MS,
  FACEOFF_REACTION_SAMPLE_CEILING_MS,
  FACEOFF_SCRUM_WINDOW_MS,
  FACEOFF_WINDOW_PER_ANTICIPATION_MS,
} from '@/features/board-game/data/balance';
import { nextFloat } from '@/features/board-game/engine/rng';
import type {
  FaceoffBand,
  FaceoffBandWindows,
  FaceoffHeadToHeadResult,
} from '@/features/board-game/types/game';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The two nested window widths (ms, measured from the drop) for a given
 * anticipation (0-100, clamped): anticipation widens the `clean` window
 * only, per Chris's ruling; the `scrum` window stays constant so a slow
 * draw is never a write-off. The UI (BG-B25) consumes these numbers
 * directly and must not hardcode window geometry.
 */
export function windowsForAnticipation(
  anticipation: number,
): FaceoffBandWindows {
  const clampedAnticipation = clamp(anticipation, 0, 100);
  return {
    cleanWindowMs:
      FACEOFF_CLEAN_WINDOW_BASE_MS +
      clampedAnticipation * FACEOFF_WINDOW_PER_ANTICIPATION_MS,
    scrumWindowMs: FACEOFF_SCRUM_WINDOW_MS,
  };
}

/**
 * The re-drop's windows after a jump: the same `scrumWindowMs`, but with
 * `FACEOFF_JUMP_WINDOW_PENALTY_MS` shaved off the clean window (floored at
 * 0) - a false start costs precision on the retry, not just a second
 * attempt. BG-A15b's `freeJump` handling skips this and re-drops with
 * `windowsForAnticipation` unpenalized instead.
 */
export function narrowedWindowsAfterJump(
  anticipation: number,
): FaceoffBandWindows {
  const base = windowsForAnticipation(anticipation);
  return {
    cleanWindowMs: Math.max(
      0,
      base.cleanWindowMs - FACEOFF_JUMP_WINDOW_PENALTY_MS,
    ),
    scrumWindowMs: base.scrumWindowMs,
  };
}

/**
 * Which band a reaction time (ms, measured from the drop) falls in, given
 * the two nested windows. A negative reaction (pressed before the drop) is
 * always `jump`, regardless of window width.
 */
export function bandForReaction(
  reactionMs: number,
  windows: FaceoffBandWindows,
): FaceoffBand {
  if (reactionMs < 0) return 'jump';
  if (reactionMs <= windows.cleanWindowMs) return 'clean';
  if (reactionMs <= windows.scrumWindowMs) return 'scrum';
  return 'late';
}

/**
 * Rolls the linesman's hold before the drop, in ms, uniformly between
 * `FACEOFF_DROP_DELAY_MIN_MS` and `FACEOFF_DROP_DELAY_MAX_MS`. Seeded, never
 * `Math.random` - the hold length is randomness the UI must ask the engine
 * for, not roll itself. Per Chris's standing ruling, this only decides
 * *when* the puck drops; difficulty lives entirely in the window widths.
 */
export function rollDropDelayMs(seed: number): [number, number] {
  const [t, nextSeed] = nextFloat(seed);
  const delayMs =
    FACEOFF_DROP_DELAY_MIN_MS +
    t * (FACEOFF_DROP_DELAY_MAX_MS - FACEOFF_DROP_DELAY_MIN_MS);
  return [Math.round(delayMs), nextSeed];
}

/**
 * Rolls a random reaction time for an anticipation-driven "read" of the
 * drop and buckets it into a band. BG-A15b cycle 2 (Chris's ruling): this
 * is now the ONE shared simulated-reaction path for BOTH the CPU centre's
 * own reaction AND a human centre's reduced-motion/headless fallback -
 * previously these used two different sampling domains (cycle 1 gave the
 * CPU its own `rollCpuFaceoffBand` after this function's original domain
 * was found to pin `late` at an unmovable 50% regardless of anticipation,
 * which made the reduced-motion fallback close to an automatic loss too -
 * a second QA finding). Sampled up to `FACEOFF_REACTION_SAMPLE_CEILING_MS`,
 * anchored on the human-reaction-time research `FACEOFF_CLEAN_WINDOW_BASE_MS`
 * cites (median ~250ms), not a self-referential multiple of the window
 * widths - so `late`'s share is a real, tunable relationship between the
 * ceiling and the (anticipation-independent) scrum window, not baked in by
 * construction. Reused as-is by `rollFaceoffHeadToHead`'s two callers in
 * `engine/faceoffDuel.ts` - no separate CPU path. Never resolves to `jump`
 * - that's a genuine human false start, only possible from a live timed
 * press.
 */
export function rollBandFromAnticipation(
  anticipation: number,
  seed: number,
): [Exclude<FaceoffBand, 'jump'>, number] {
  const windows = windowsForAnticipation(anticipation);
  const [t, nextSeed] = nextFloat(seed);
  const reactionMs = t * FACEOFF_REACTION_SAMPLE_CEILING_MS;
  // reactionMs is always >= 0 here, so bandForReaction can never return 'jump'.
  return [
    bandForReaction(reactionMs, windows) as Exclude<FaceoffBand, 'jump'>,
    nextSeed,
  ];
}

/**
 * The symmetric head-to-head faceoff contest (BG-A15b cycle 2, replacing
 * cycle 1's one-sided `rollFaceoffContest`): both centres bring a real band
 * and a grip, and this ONE function decides between them - reused as-is for
 * the user's side and the CPU's side, never a separate path for either
 * (Chris's ruling: "centres should compete, shouldn't be like shot").
 * Reuses `BASE_WIN_BY_BAND` rather than inventing a second table:
 *
 * - Both sides read the SAME non-`clean` band (`scrum`/`scrum` or
 *   `late`/`late`) - a genuine tie with nothing to grade it on: an
 *   automatic **scrum** (`outcome: 'scrum'`), puck loose
 *   (`engine/duelOutcome.ts` picks the tile). No roll is made; `winChance`
 *   is 0. This is the corrected cycle-2 boundary - an EARLIER cycle-2 pass
 *   gated the scrum on "neither side clean" instead of "both sides equal
 *   and non-clean", which meant a `scrum`-band read could never out-compete
 *   a `late`-band read at all (always an automatic scrum, regardless of the
 *   real edge between them) - exactly the kind of flattened, not-really-
 *   competing draw Chris's ruling rejected, and it made a winning side's own
 *   band provably always `clean` whenever the opponent was pinned `late`
 *   (QA finding, BG-A15b cycle 2 review: `engine/faceoffDuel.test.ts`'s
 *   "the CPU's own card effect fires on some of its wins and not others"
 *   proof of genuine band variance is unsatisfiable by construction under
 *   the old boundary, for ANY sampling distribution - not a sampling bug).
 * - Otherwise (both `clean`, or the two bands differ): `winChance =
 *   50 + (BASE_WIN_BY_BAND[userBand] - BASE_WIN_BY_BAND[cpuBand]) +
 *   (userGrip - cpuGrip)`, clamped to `[0, 100]`, rolled through
 *   `engine/rng.ts`. When both bands are `clean` (or any other tie) the two
 *   base-band terms cancel exactly, so grip alone around a fair 50/50
 *   decides it - "both clean -> grip difference decides" falls out of the
 *   same formula as a degenerate case, not a special-cased branch. When the
 *   bands differ, the base-band terms add a real edge on top of grip,
 *   graded by how far one band's base value sits above the other's
 *   (`clean` beating `late` is a bigger edge than `clean` beating `scrum`,
 *   which in turn is bigger than `scrum` beating `late`) - a `scrum` read
 *   is a real, if lesser, edge over a `late` one, not a coin flip's worth of
 *   nothing.
 *
 * The winning side's card `faceoffEffect` fires only when that side's own
 * band was `'clean'` (checked by the caller, not here - this function only
 * decides who wins) - so a `scrum`-band win off the edge above still just
 * carries the puck, no bonus.
 */
export function rollFaceoffHeadToHead(
  userBand: Exclude<FaceoffBand, 'jump'>,
  userGrip: number,
  cpuBand: Exclude<FaceoffBand, 'jump'>,
  cpuGrip: number,
  seed: number,
): [FaceoffHeadToHeadResult, number] {
  if (userBand === cpuBand && userBand !== 'clean') {
    return [{ outcome: 'scrum', userWins: false, winChance: 0 }, seed];
  }
  const edge = BASE_WIN_BY_BAND[userBand] - BASE_WIN_BY_BAND[cpuBand];
  const winChance = clamp(50 + edge + (userGrip - cpuGrip), 0, 100);
  const [roll, nextSeed] = nextFloat(seed);
  const userWins = roll * 100 < winChance;
  return [{ outcome: 'win', userWins, winChance }, nextSeed];
}
