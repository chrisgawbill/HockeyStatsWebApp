/**
 * Faceoff minigame model, wired in by `engine/faceoffDuel.ts`. Both centres
 * resolve through the same `rollFaceoffHeadToHead`, never a separate CPU
 * path. Windows come from `windowsForAnticipation` — the UI must not
 * hardcode window geometry. Mirrors `shotModel.ts`'s structure.
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
 * The two nested window widths (ms from the drop) for a given anticipation
 * (0-100, clamped). Only `clean` widens with anticipation; `scrum` is
 * constant. The UI must not hardcode this geometry.
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
 * Re-drop windows after a jump: same `scrumWindowMs`, with
 * `FACEOFF_JUMP_WINDOW_PENALTY_MS` shaved off `cleanWindowMs` (floored at
 * 0). The `freeJump` effect skips this and uses `windowsForAnticipation` unpenalized.
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
 * Band for a reaction time (ms from the drop), given the two nested
 * windows. Negative (pressed before the drop) is always `jump`.
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
 * Linesman's hold before the drop, in ms, uniform between
 * `FACEOFF_DROP_DELAY_MIN_MS` and `_MAX_MS`. Seeded — the UI must request
 * this from the engine, never roll it locally. Decides only *when* the puck
 * drops, not reaction difficulty.
 */
export function rollDropDelayMs(seed: number): [number, number] {
  const [t, nextSeed] = nextFloat(seed);
  const delayMs =
    FACEOFF_DROP_DELAY_MIN_MS +
    t * (FACEOFF_DROP_DELAY_MAX_MS - FACEOFF_DROP_DELAY_MIN_MS);
  return [Math.round(delayMs), nextSeed];
}

/**
 * Random reaction time for an anticipation-driven "read" of the drop,
 * bucketed into a band. The ONE shared path for both the CPU centre and a
 * human centre's reduced-motion/headless fallback — reused as-is by
 * `rollFaceoffHeadToHead`'s two callers. Sampled up to
 * `FACEOFF_REACTION_SAMPLE_CEILING_MS`; never resolves to `jump` (that's a
 * genuine human false start, only possible from a live timed press).
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
 * Symmetric head-to-head faceoff contest: both centres bring a band and a
 * grip, and this ONE function decides between them — no separate CPU path.
 * Same non-`clean` band on both sides is a tie: automatic `scrum`, no roll,
 * `winChance` 0. Otherwise `winChance = 50 + (BASE_WIN_BY_BAND[userBand] -
 * BASE_WIN_BY_BAND[cpuBand]) + (userGrip - cpuGrip)`, clamped to `[0, 100]`
 * — equal bands cancel to grip-only odds. `faceoffEffect` firing on a clean
 * win is the caller's job, not this function's. Full rationale:
 * docs/board-game-design.md §8.
 *
 * @param seed - advances on every roll; thread the returned seed into the
 * next call, don't reuse the input.
 * @example
 * const [result, seed2] = rollFaceoffHeadToHead('clean', 2, 'scrum', 5, seed);
 * // seed2, not seed, feeds whatever rolls next (e.g. pickScrumTile).
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
