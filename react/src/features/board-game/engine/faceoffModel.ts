/**
 * Faceoff minigame engine model (BG-A15a). Pure and additive: nothing in the
 * running game calls this yet (BG-A15b wires it in and fully replaces the
 * faceoff card duel). Contract for BG-B25: `FaceoffBand`, `FaceoffBandWindows`,
 * and `rollFaceoffContest` (types/game.ts has the shapes). Windows come from
 * `windowsForAnticipation`; the UI must not hardcode window geometry. Mirrors
 * `shotModel.ts`'s structure: a card's `anticipation`/`grip` play the same
 * two roles `accuracy`/`power` play there.
 */
import {
  BASE_WIN_BY_BAND,
  CPU_FACEOFF_REACTION,
  FACEOFF_CLEAN_WINDOW_BASE_MS,
  FACEOFF_DROP_DELAY_MAX_MS,
  FACEOFF_DROP_DELAY_MIN_MS,
  FACEOFF_JUMP_WINDOW_PENALTY_MS,
  FACEOFF_SCRUM_WINDOW_MS,
  FACEOFF_WINDOW_PER_ANTICIPATION_MS,
} from '@/features/board-game/data/balance';
import { nextFloat } from '@/features/board-game/engine/rng';
import type {
  FaceoffBand,
  FaceoffBandWindows,
  FaceoffContestResult,
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
 * Rolls a random reaction time for an anticipation-driven "read" of the drop
 * (the CPU's faceoff, or a reduced-motion auto-resolve) and buckets it into
 * a band. Mirrors `rollBandFromAccuracy`: the sampled domain runs from 0 to
 * double the scrum window, so `late` stays reachable with meaningful
 * probability - that span is structural (the reaction-time analogue of the
 * shot track's fixed `[0,1]` width), not a Chris-tunable dial;
 * `CPU_FACEOFF_REACTION` is the tuning knob. Never resolves to `jump` -
 * that's a human-only false start, exactly as `miss` is UI-only for shots.
 */
export function rollBandFromAnticipation(
  anticipation: number,
  seed: number,
): [Exclude<FaceoffBand, 'jump'>, number] {
  const windows = windowsForAnticipation(anticipation);
  const [t, nextSeed] = nextFloat(seed);
  const reactionMs = t * windows.scrumWindowMs * 2;
  // reactionMs is always >= 0 here, so bandForReaction can never return 'jump'.
  return [
    bandForReaction(reactionMs, windows) as Exclude<FaceoffBand, 'jump'>,
    nextSeed,
  ];
}

/** The CPU's seeded faceoff band roll against its fixed reaction difficulty. Same `rollFaceoffContest` resolves it afterward - no second path for the CPU. */
export function rollCpuFaceoffBand(
  seed: number,
): [Exclude<FaceoffBand, 'jump'>, number] {
  return rollBandFromAnticipation(CPU_FACEOFF_REACTION, seed);
}

/**
 * Rolls the contest for a resolved faceoff band. On `clean`/`scrum`/`late`:
 * `winChance = BASE_WIN_BY_BAND[band] + grip - opponentGrip`, clamped to
 * `[0, 100]`, rolled through `engine/rng.ts` (never `Math.random`) - the
 * same function for the human and the CPU draw. On `jump`: no contest is
 * rolled at all. A jump is a false start - the first one earns a re-drop
 * (`reDrop: true`, caller re-runs the reaction through
 * `narrowedWindowsAfterJump`); pass `isRepeatJump: true` for a second jump
 * in the same draw and it loses outright (`reDrop: false`, `won: false`).
 */
export function rollFaceoffContest(
  band: FaceoffBand,
  grip: number,
  opponentGrip: number,
  isRepeatJump: boolean,
  seed: number,
): [FaceoffContestResult, number] {
  if (band === 'jump') {
    return [{ band, won: false, winChance: 0, reDrop: !isRepeatJump }, seed];
  }
  const rawChance = BASE_WIN_BY_BAND[band] + grip - opponentGrip;
  const winChance = clamp(rawChance, 0, 100);
  const [roll, nextSeed] = nextFloat(seed);
  const won = roll * 100 < winChance;
  return [{ band, won, winChance, reDrop: false }, nextSeed];
}
